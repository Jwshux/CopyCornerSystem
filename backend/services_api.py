from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import json

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

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

def serialize_doc(doc):
    if not doc:
        return doc
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_doc(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            serialized[key] = value
    return serialized

def generate_service_id():
    services = list(service_types_collection.find({"is_archived": {"$ne": True}}).sort("created_at", 1))
    if not services:
        return "ST-001"
    
    count = service_types_collection.count_documents({"is_archived": {"$ne": True}})
    return f"ST-{count + 1:03d}"

@service_types_bp.route('/api/service_types', methods=['GET'])
def get_service_types():
    try:
        page_param = request.args.get('page')
        per_page_param = request.args.get('per_page')
        
        # Only fetch non-archived service types
        query = {"is_archived": {"$ne": True}}
        
        # If no pagination parameters, return all active service types
        if not page_param and not per_page_param:
            service_types = list(service_types_collection.find(query).sort("service_name", 1))
            
            for service in service_types:
                # Handle both old 'category' field and new 'category_id' relationship
                if service.get('category_id'):
                    category = categories_collection.find_one({'_id': ObjectId(service['category_id'])})
                    service['category_name'] = category['name'] if category else 'Unknown'
                elif service.get('category'):
                    # Fallback to old category field
                    service['category_name'] = service['category']
                else:
                    service['category_name'] = 'Uncategorized'
            
            serialized_service_types = [serialize_doc(service_type) for service_type in service_types]
            return jsonify(serialized_service_types)
        
        # Handle paginated request
        page = int(page_param or 1)
        per_page = int(per_page_param or 10)
        skip = (page - 1) * per_page
        
        total_service_types = service_types_collection.count_documents(query)
        total_pages = (total_service_types + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        service_types_cursor = service_types_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        service_types = list(service_types_cursor)
        
        for service in service_types:
            # Handle both old 'category' field and new 'category_id' relationship
            if service.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(service['category_id'])})
                service['category_name'] = category['name'] if category else 'Unknown'
            elif service.get('category'):
                # Fallback to old category field
                service['category_name'] = service['category']
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

# GET ARCHIVED SERVICE TYPES
@service_types_bp.route('/api/service_types/archived', methods=['GET'])
def get_archived_service_types():
    try:
        service_types = list(service_types_collection.find({"is_archived": True}).sort("archived_at", -1))
        
        for service in service_types:
            if service.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(service['category_id'])})
                service['category_name'] = category['name'] if category else 'Unknown'
            elif service.get('category'):
                service['category_name'] = service['category']
        
        serialized_service_types = [serialize_doc(service) for service in service_types]
        return jsonify(serialized_service_types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types/<service_type_id>', methods=['GET'])
def get_service_type(service_type_id):
    try:
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if service_type:
            # Handle both old 'category' field and new 'category_id' relationship
            if service_type.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(service_type['category_id'])})
                service_type['category_data'] = serialize_doc(category) if category else None
                service_type['category_name'] = category['name'] if category else 'Unknown'
            elif service_type.get('category'):
                # Fallback to old category field
                service_type['category_name'] = service_type['category']
            
            # Count only non-archived transactions
            transaction_count = transactions_collection.count_documents({
                'service_type': service_type['service_name'],
                'is_archived': {'$ne': True}
            })
            service_type['transaction_count'] = transaction_count
            
            return jsonify(serialize_doc(service_type))
        return jsonify({'error': 'Service type not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types', methods=['POST'])
def create_service_type():
    try:
        data = request.json
        
        # Check if service name already exists (including archived ones)
        existing_service = service_types_collection.find_one({
            'service_name': data['service_name'],
            'is_archived': {'$ne': True}
        })
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
            'category': data.get('category', ''),  # Keep old field for compatibility
            'status': data.get('status', 'Active'),
            'is_archived': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = service_types_collection.insert_one(new_service_type)
        
        # Fetch the complete inserted document
        inserted_service = service_types_collection.find_one({'_id': result.inserted_id})
        
        if not inserted_service:
            return jsonify({'error': 'Failed to create service type'}), 500
            
        # Add category name for response
        if inserted_service.get('category_id'):
            category = categories_collection.find_one({'_id': ObjectId(inserted_service['category_id'])})
            inserted_service['category_name'] = category['name'] if category else 'Unknown'
        elif inserted_service.get('category'):
            inserted_service['category_name'] = inserted_service['category']
        
        # Properly serialize before returning
        serialized_service = serialize_doc(inserted_service)
        return jsonify(serialized_service), 201
        
    except Exception as e:
        print(f"Error creating service type: {str(e)}")
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types/<service_type_id>', methods=['PUT'])
def update_service_type(service_type_id):
    try:
        data = request.json
        
        current_service = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not current_service:
            return jsonify({'error': 'Service type not found'}), 404
        
        if data['service_name'] != current_service['service_name']:
            # Count only non-archived transactions
            transaction_count = transactions_collection.count_documents({
                'service_type': current_service['service_name'],
                'is_archived': {'$ne': True}
            })
            if transaction_count > 0:
                return jsonify({
                    'error': f'Cannot rename service type "{current_service["service_name"]}". {transaction_count} active transaction(s) are using this service type. Please update transactions first.'
                }), 400
        
        existing_service = service_types_collection.find_one({
            'service_name': data['service_name'],
            '_id': {'$ne': ObjectId(service_type_id)},
            'is_archived': {'$ne': True}
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
            'category': data.get('category', ''),  # Keep old field for compatibility
            'status': data.get('status', 'Active'),
            'updated_at': datetime.utcnow()
        }
        
        result = service_types_collection.update_one(
            {'_id': ObjectId(service_type_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            # Fetch the updated document
            updated_service = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
            if updated_service:
                # Add category name for response
                if updated_service.get('category_id'):
                    category = categories_collection.find_one({'_id': ObjectId(updated_service['category_id'])})
                    updated_service['category_name'] = category['name'] if category else 'Unknown'
                
                serialized_service = serialize_doc(updated_service)
                return jsonify(serialized_service)
            
            return jsonify({'message': 'Service type updated successfully'})
        return jsonify({'error': 'Service type not found'}), 404
    except Exception as e:
        print(f"Error updating service type: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ARCHIVE SERVICE TYPE ENDPOINT - FIXED
@service_types_bp.route('/api/service_types/<service_type_id>/archive', methods=['PUT'])
def archive_service_type(service_type_id):
    try:
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not service_type:
            return jsonify({'error': 'Service type not found'}), 404
        
        # Check if service type has ACTIVE transactions (exclude archived ones)
        transaction_count = transactions_collection.count_documents({
            'service_type': service_type['service_name'],
            'is_archived': {'$ne': True}  # Only count non-archived transactions
        })
        if transaction_count > 0:
            return jsonify({
                'error': f'Cannot archive service type "{service_type["service_name"]}". {transaction_count} active transaction(s) are using this service type. Please archive these transactions first.'
            }), 400
        
        # Archive the service type
        result = service_types_collection.update_one(
            {'_id': ObjectId(service_type_id)},
            {'$set': {
                'is_archived': True,
                'archived_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Service type archived successfully'})
        return jsonify({'error': 'Failed to archive service type'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# RESTORE SERVICE TYPE ENDPOINT
@service_types_bp.route('/api/service_types/<service_type_id>/restore', methods=['PUT'])
def restore_service_type(service_type_id):
    try:
        # Check if service type exists and is archived
        service_type = service_types_collection.find_one({'_id': ObjectId(service_type_id)})
        if not service_type:
            return jsonify({'error': 'Service type not found'}), 404
        
        if not service_type.get('is_archived'):
            return jsonify({'error': 'Service type is not archived'}), 400
        
        # Check if service name already exists in active service types
        existing_service = service_types_collection.find_one({
            'service_name': service_type['service_name'],
            '_id': {'$ne': ObjectId(service_type_id)},
            'is_archived': {'$ne': True}
        })
        if existing_service:
            return jsonify({'error': 'A service type with this name already exists'}), 400
        
        # Restore the service type
        result = service_types_collection.update_one(
            {'_id': ObjectId(service_type_id)},
            {'$set': {
                'is_archived': False,
                'restored_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Service type restored successfully'})
        return jsonify({'error': 'Failed to restore service type'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@service_types_bp.route('/api/service_types/category/<category_id>', methods=['GET'])
def get_service_types_by_category_id(category_id):
    try:
        service_types = list(service_types_collection.find({
            'category_id': ObjectId(category_id), 
            'status': 'Active',
            'is_archived': {'$ne': True}
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
            'category_id': service_type['category_id'],
            'is_archived': {'$ne': True}
        }).sort("product_name", 1))
        
        serialized_products = [serialize_doc(product) for product in products]
        return jsonify(serialized_products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500