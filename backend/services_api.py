from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

service_types_bp = Blueprint('service_types', __name__)

service_types_collection = None
transactions_collection = None
categories_collection = None
products_collection = None

def init_service_types_db(mongo_collection, transactions_coll):
    global service_types_collection, transactions_collection
    service_types_collection = mongo_collection
    transactions_collection = transactions_coll

def init_service_types_relationships(categories_coll, products_coll):
    global categories_collection, products_collection
    categories_collection = categories_coll
    products_collection = products_coll

def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        # Also convert any ObjectId fields
        if 'category_id' in doc and doc['category_id']:
            doc['category_id'] = str(doc['category_id'])
    return doc

def generate_service_id():
    services = list(service_types_collection.find().sort("created_at", 1))
    if not services:
        return "ST-001"
    
    count = service_types_collection.count_documents({})
    return f"ST-{count + 1:03d}"

@service_types_bp.route('/api/service_types', methods=['GET'])
def get_service_types():
    try:
        page_param = request.args.get('page')
        per_page_param = request.args.get('per_page')
        
        # If no pagination parameters, return all active service types
        if not page_param and not per_page_param:
            service_types = list(service_types_collection.find({"status": "Active"}).sort("service_name", 1))
            
            for service in service_types:
                if service.get('category_id'):
                    category = categories_collection.find_one({'_id': ObjectId(service['category_id'])})
                    service['category_name'] = category['name'] if category else 'Unknown'
                else:
                    service['category_name'] = 'Uncategorized'
            
            serialized_service_types = [serialize_doc(service_type) for service_type in service_types]
            return jsonify(serialized_service_types)
        
        # Handle paginated request
        page = int(page_param or 1)
        per_page = int(per_page_param or 10)
        skip = (page - 1) * per_page
        
        total_service_types = service_types_collection.count_documents({})
        total_pages = (total_service_types + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        service_types_cursor = service_types_collection.find().sort("created_at", -1).skip(skip).limit(per_page)
        service_types = list(service_types_cursor)
        
        for service in service_types:
            if service.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(service['category_id'])})
                service['category_name'] = category['name'] if category else 'Unknown'
            else:
                service['category_name'] = 'Uncategorized'
        
        serialized_service_types = [serialize_doc(service_type) for service_type in service_types]
        
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

@service_types_bp.route('/api/service_types/<service_type_id>', methods=['GET'])
def get_service_type(service_type_id):
    try:
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if service_type:
            if service_type.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(service_type['category_id'])})
                service_type['category_data'] = serialize_doc(category) if category else None
            
            transaction_count = transactions_collection.count_documents({'service_type': service_type['service_name']})
            service_type['transaction_count'] = transaction_count
            
            return jsonify(serialize_doc(service_type))
        return jsonify({'error': 'Service type not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types', methods=['POST'])
def create_service_type():
    try:
        data = request.json
        
        existing_service = service_types_collection.find_one({'service_name': data['service_name']})
        if existing_service:
            return jsonify({'error': 'Service type name already exists'}), 400
        
        if data.get('category_id'):
            category = categories_collection.find_one({'_id': ObjectId(data['category_id'])})
            if not category:
                return jsonify({'error': 'Category not found'}), 400
        
        new_service_type = {
            'service_id': generate_service_id(),
            'service_name': data['service_name'],
            'category_id': ObjectId(data['category_id']) if data.get('category_id') else None,
            'status': data.get('status', 'Active'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = service_types_collection.insert_one(new_service_type)
        new_service_type['_id'] = str(result.inserted_id)
        return jsonify(new_service_type), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types/<service_type_id>', methods=['PUT'])
def update_service_type(service_type_id):
    try:
        data = request.json
        
        current_service = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not current_service:
            return jsonify({'error': 'Service type not found'}), 404
        
        if data['service_name'] != current_service['service_name']:
            transaction_count = transactions_collection.count_documents({'service_type': current_service['service_name']})
            if transaction_count > 0:
                return jsonify({
                    'error': f'Cannot rename service type "{current_service["service_name"]}". {transaction_count} transaction(s) are using this service type. Please update transactions first.'
                }), 400
        
        existing_service = service_types_collection.find_one({
            'service_name': data['service_name'],
            '_id': {'$ne': ObjectId(service_type_id)}
        })
        if existing_service:
            return jsonify({'error': 'Service type name already exists'}), 400
        
        if data.get('category_id'):
            category = categories_collection.find_one({'_id': ObjectId(data['category_id'])})
            if not category:
                return jsonify({'error': 'Category not found'}), 400
        
        update_data = {
            'service_name': data['service_name'],
            'category_id': ObjectId(data['category_id']) if data.get('category_id') else None,
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

@service_types_bp.route('/api/service_types/<service_type_id>', methods=['DELETE'])
def delete_service_type(service_type_id):
    try:
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not service_type:
            return jsonify({'error': 'Service type not found'}), 404
        
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

@service_types_bp.route('/api/service_types/category/<category_id>', methods=['GET'])
def get_service_types_by_category_id(category_id):
    try:
        service_types = list(service_types_collection.find({
            'category_id': ObjectId(category_id), 
            'status': 'Active'
        }).sort("service_name", 1))
        
        for service in service_types:
            if service.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(service['category_id'])})
                service['category_name'] = category['name'] if category else 'Unknown'
        
        serialized_service_types = [serialize_doc(service) for service in service_types]
        return jsonify(serialized_service_types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types/<service_type_id>/products', methods=['GET'])
def get_products_for_service_type(service_type_id):
    try:
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not service_type:
            return jsonify({'error': 'Service type not found'}), 404
        
        if not service_type.get('category_id'):
            return jsonify([])
        
        products = list(products_collection.find({
            'category_id': service_type['category_id']
        }).sort("product_name", 1))
        
        serialized_products = [serialize_doc(product) for product in products]
        return jsonify(serialized_products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500