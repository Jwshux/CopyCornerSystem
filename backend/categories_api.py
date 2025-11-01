from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

categories_bp = Blueprint('categories', __name__)

categories_collection = None
products_collection = None
service_types_collection = None

def init_categories_db(mongo_collection, products_coll, service_types_coll):
    global categories_collection, products_collection, service_types_collection
    categories_collection = mongo_collection
    products_collection = products_coll
    service_types_collection = service_types_coll

def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        page_param = request.args.get('page')
        per_page_param = request.args.get('per_page')
        
        # Only fetch non-archived categories
        query = {'is_archived': {'$ne': True}}
        
        # If no pagination parameters, return all categories
        if not page_param and not per_page_param:
            categories = list(categories_collection.find(query).sort("created_at", 1))
            
            for category in categories:
                category_id = category['_id']
                product_count = products_collection.count_documents({
                    'category_id': category_id,
                    'is_archived': {'$ne': True}
                })
                category['product_count'] = product_count
                service_count = service_types_collection.count_documents({'category_id': category_id})
                category['service_type_count'] = service_count
            
            serialized_categories = [serialize_doc(category) for category in categories]
            return jsonify(serialized_categories)
        
        # Handle paginated request
        page = int(page_param or 1)
        per_page = int(per_page_param or 5)  # CHANGED TO 5 FOR CATEGORIES
        skip = (page - 1) * per_page
        
        total_categories = categories_collection.count_documents(query)
        total_pages = (total_categories + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        categories_cursor = categories_collection.find(query).sort("created_at", 1).skip(skip).limit(per_page)
        categories = list(categories_cursor)
        
        for category in categories:
            category_id = category['_id']
            product_count = products_collection.count_documents({
                'category_id': category_id,
                'is_archived': {'$ne': True}
            })
            category['product_count'] = product_count
            service_count = service_types_collection.count_documents({'category_id': category_id})
            category['service_type_count'] = service_count
        
        serialized_categories = [serialize_doc(category) for category in categories]
        
        return jsonify({
            'categories': serialized_categories,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_categories,  # CHANGE THIS
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/api/categories/<category_id>', methods=['GET'])
def get_category(category_id):
    try:
        category = categories_collection.find_one({'_id': ObjectId(category_id)})
        if category:
            products = list(products_collection.find({'category_id': ObjectId(category_id)}))
            category['products'] = [serialize_doc(product) for product in products]
            
            service_types = list(service_types_collection.find({'category_id': ObjectId(category_id)}))
            category['service_types'] = [serialize_doc(service) for service in service_types]
            
            return jsonify(serialize_doc(category))
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/api/categories', methods=['POST'])
def create_category():
    try:
        data = request.json
        
        # Check if category name already exists (including archived ones)
        existing_category = categories_collection.find_one({
            'name': data['name'],
            'is_archived': {'$ne': True}
        })
        if existing_category:
            return jsonify({'error': 'Category name already exists'}), 400
        
        new_category = {
            'name': data['name'],
            'description': data.get('description', ''),
            'is_archived': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = categories_collection.insert_one(new_category)
        new_category['_id'] = str(result.inserted_id)
        return jsonify(new_category), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/api/categories/<category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        data = request.json
        
        current_category = categories_collection.find_one({'_id': ObjectId(category_id)})
        if not current_category:
            return jsonify({'error': 'Category not found'}), 404
        
        if data['name'] != current_category['name']:
            product_count = products_collection.count_documents({
                'category_id': ObjectId(category_id),
                'is_archived': {'$ne': True}
            })
            if product_count > 0:
                return jsonify({
                    'error': f'Cannot rename category "{current_category["name"]}". {product_count} product(s) are using this category. Please reassign products first.'
                }), 400
        
        existing_category = categories_collection.find_one({
            'name': data['name'],
            '_id': {'$ne': ObjectId(category_id)},
            'is_archived': {'$ne': True}
        })
        if existing_category:
            return jsonify({'error': 'Category name already exists'}), 400
        
        update_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'updated_at': datetime.utcnow()
        }
        
        result = categories_collection.update_one(
            {'_id': ObjectId(category_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Category updated successfully'})
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ARCHIVE CATEGORY ENDPOINT
@categories_bp.route('/api/categories/<category_id>/archive', methods=['PUT'])
def archive_category(category_id):
    try:
        # Check if category exists
        category = categories_collection.find_one({'_id': ObjectId(category_id)})
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Check if category has active products
        product_count = products_collection.count_documents({
            'category_id': ObjectId(category_id),
            'is_archived': {'$ne': True}  # Only count non-archived products
        })
        if product_count > 0:
            return jsonify({
                'error': f'Cannot archive category "{category["name"]}". {product_count} active product(s) are using this category. Please archive products first.'
            }), 400
        
        # Check if category has active service types
        service_type_count = service_types_collection.count_documents({
            'category_id': ObjectId(category_id),
            'status': 'Active',  # Only count active service types
            'is_archived': {'$ne': True}  # Only count non-archived service types
        })
        if service_type_count > 0:
            return jsonify({
                'error': f'Cannot archive category "{category["name"]}". {service_type_count} active service type(s) are using this category. Please update service types first.'
            }), 400
        
        # Update category to set as archived
        result = categories_collection.update_one(
            {'_id': ObjectId(category_id)},
            {'$set': {
                'is_archived': True,
                'archived_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Category archived successfully'})
        return jsonify({'error': 'Failed to archive category'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# RESTORE CATEGORY ENDPOINT
@categories_bp.route('/api/categories/<category_id>/restore', methods=['PUT'])
def restore_category(category_id):
    try:
        # Check if category exists and is archived
        category = categories_collection.find_one({'_id': ObjectId(category_id)})
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        if not category.get('is_archived'):
            return jsonify({'error': 'Category is not archived'}), 400
        
        # Check if category name already exists in active categories
        existing_category = categories_collection.find_one({
            'name': category['name'],
            '_id': {'$ne': ObjectId(category_id)},
            'is_archived': {'$ne': True}
        })
        if existing_category:
            return jsonify({'error': 'A category with this name already exists'}), 400
        
        # Restore the category
        result = categories_collection.update_one(
            {'_id': ObjectId(category_id)},
            {'$set': {
                'is_archived': False,
                'restored_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Category restored successfully'})
        return jsonify({'error': 'Failed to restore category'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET ARCHIVED CATEGORIES - UPDATED WITH PAGINATION
@categories_bp.route('/api/categories/archived', methods=['GET'])
def get_archived_categories():
    try:
        page_param = request.args.get('page')
        per_page_param = request.args.get('per_page')
        
        # Only fetch archived categories
        query = {'is_archived': True}
        
        # If no pagination parameters, return all archived categories
        if not page_param and not per_page_param:
            categories = list(categories_collection.find(query).sort("archived_at", -1))
            
            for category in categories:
                category_id = category['_id']
                product_count = products_collection.count_documents({'category_id': category_id})
                category['product_count'] = product_count
                service_count = service_types_collection.count_documents({'category_id': category_id})
                category['service_type_count'] = service_count
            
            serialized_categories = [serialize_doc(category) for category in categories]
            return jsonify(serialized_categories)
        
        # Handle paginated request
        page = int(page_param or 1)
        per_page = int(per_page_param or 5)  # CHANGED TO 5 FOR CATEGORIES
        skip = (page - 1) * per_page
        
        total_categories = categories_collection.count_documents(query)
        total_pages = (total_categories + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        categories_cursor = categories_collection.find(query).sort("archived_at", -1).skip(skip).limit(per_page)
        categories = list(categories_cursor)
        
        for category in categories:
            category_id = category['_id']
            product_count = products_collection.count_documents({'category_id': category_id})
            category['product_count'] = product_count
            service_count = service_types_collection.count_documents({'category_id': category_id})
            category['service_type_count'] = service_count
        
        serialized_categories = [serialize_doc(category) for category in categories]
        
        return jsonify({
            'categories': serialized_categories,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_categories,  
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/api/categories/<category_id>/products', methods=['GET'])
def get_products_by_category(category_id):
    try:
        products = list(products_collection.find({
            'category_id': ObjectId(category_id),
            'is_archived': {'$ne': True}
        }).sort("product_name", 1))
        serialized_products = [serialize_doc(product) for product in products]
        return jsonify(serialized_products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/api/categories/<category_id>/service-types', methods=['GET'])
def get_service_types_by_category(category_id):
    try:
        service_types = list(service_types_collection.find({'category_id': ObjectId(category_id), 'status': 'Active'}).sort("service_name", 1))
        serialized_service_types = [serialize_doc(service) for service in service_types]
        return jsonify(serialized_service_types)
    except Exception as e:
        return jsonify({'error': str(e)}), 500