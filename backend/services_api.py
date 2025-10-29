from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for service_types routes
service_types_bp = Blueprint('service_types', __name__)

# MongoDB connection (will be initialized from app.py)
service_types_collection = None
transactions_collection = None  # NEW: Add transactions collection

def init_service_types_db(mongo_collection, transactions_coll):
    """Initialize the service_types collection from app.py"""
    global service_types_collection, transactions_collection
    service_types_collection = mongo_collection
    transactions_collection = transactions_coll  # NEW: Initialize transactions collection

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Generate sequential service ID
def generate_service_id():
    services = list(service_types_collection.find().sort("created_at", 1))
    if not services:
        return "ST-001"
    
    # Count existing services for sequential numbering
    count = service_types_collection.count_documents({})
    return f"ST-{count + 1:03d}"

# Get all service types
@service_types_bp.route('/api/service_types', methods=['GET'])
def get_service_types():
    try:
        # Check if pagination parameters are provided
        page_param = request.args.get('page')
        per_page_param = request.args.get('per_page')
        
        # If no pagination parameters, return all service_types (for transactions dropdown)
        if not page_param and not per_page_param:
            service_types = list(service_types_collection.find({"status": "Active"}).sort("service_name", 1))
            serialized_service_types = [serialize_doc(service_type) for service_type in service_types]
            return jsonify(serialized_service_types)
        
        # Otherwise, use pagination
        page = int(page_param or 1)
        per_page = int(per_page_param or 10)
        
        # Calculate skip value
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        total_service_types = service_types_collection.count_documents({})
        
        # Calculate total pages
        total_pages = (total_service_types + per_page - 1) // per_page
        
        # If requested page is beyond available pages, go to last page
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        # Get paginated service_types
        service_types_cursor = service_types_collection.find().sort("created_at", -1).skip(skip).limit(per_page)
        service_types = list(service_types_cursor)
        
        serialized_service_types = [serialize_doc(service_type) for service_type in service_types]
        
        # Return pagination info along with service_types
        return jsonify({
            'service_types': serialized_service_types,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_service_types': total_service_types,
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single service type by ID
@service_types_bp.route('/api/service_types/<service_type_id>', methods=['GET'])
def get_service_type(service_type_id):
    try:
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if service_type:
            return jsonify(serialize_doc(service_type))
        return jsonify({'error': 'Service type not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new service type
@service_types_bp.route('/api/service_types', methods=['POST'])
def create_service_type():
    try:
        data = request.json
        
        # Check if service name already exists
        existing_service = service_types_collection.find_one({'service_name': data['service_name']})
        if existing_service:
            return jsonify({'error': 'Service type name already exists'}), 400
        
        new_service_type = {
            'service_id': generate_service_id(),
            'service_name': data['service_name'],
            'category': data['category'],  # NEW FIELD: Paper, T-shirt, Supplies, etc.
            'status': data.get('status', 'Active'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = service_types_collection.insert_one(new_service_type)
        new_service_type['_id'] = str(result.inserted_id)
        return jsonify(new_service_type), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update service type - MODIFIED TO PREVENT UPDATES IF USED IN TRANSACTIONS
@service_types_bp.route('/api/service_types/<service_type_id>', methods=['PUT'])
def update_service_type(service_type_id):
    try:
        data = request.json
        
        # Get current service type first to know the old name
        current_service = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not current_service:
            return jsonify({'error': 'Service type not found'}), 404
        
        # Check if service name is being changed
        if data['service_name'] != current_service['service_name']:
            # Check if any transactions are using this service type
            transaction_count = transactions_collection.count_documents({'service_type': current_service['service_name']})
            if transaction_count > 0:
                return jsonify({
                    'error': f'Cannot rename service type "{current_service["service_name"]}". {transaction_count} transaction(s) are using this service type. Please update transactions first.'
                }), 400
        
        # Check if service name already exists (excluding current service)
        existing_service = service_types_collection.find_one({
            'service_name': data['service_name'],
            '_id': {'$ne': ObjectId(service_type_id)}
        })
        if existing_service:
            return jsonify({'error': 'Service type name already exists'}), 400
        
        update_data = {
            'service_name': data['service_name'],
            'category': data['category'],  # NEW FIELD
            'status': data.get('status', 'Active'),
            'updated_at': datetime.utcnow()
        }
        
        result = service_types_collection.update_one(
            {'_id': ObjectId(service_type_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Service type updated successfully'})
        return jsonify({'error': 'Service type not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete service type - MODIFIED TO PREVENT DELETION IF USED IN TRANSACTIONS
@service_types_bp.route('/api/service_types/<service_type_id>', methods=['DELETE'])
def delete_service_type(service_type_id):
    try:
        # Get service type first to check if it has transactions
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not service_type:
            return jsonify({'error': 'Service type not found'}), 404
        
        # Check if any transactions are using this service type
        transaction_count = transactions_collection.count_documents({'service_type': service_type['service_name']})
        if transaction_count > 0:
            return jsonify({
                'error': f'Cannot delete service type "{service_type["service_name"]}". {transaction_count} transaction(s) are using this service type. Please delete or update transactions first.'
            }), 400
        
        result = service_types_collection.delete_one({'_id': ObjectId(service_type_id)})
        if result.deleted_count:
            return jsonify({'message': 'Service type deleted successfully'})
        return jsonify({'error': 'Service type not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500