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
        
        # If no pagination parameters, return all categories
        if not page_param and not per_page_param:
            categories = list(categories_collection.find().sort("created_at", 1))
            
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
        per_page = int(per_page_param or 10)
        skip = (page - 1) * per_page
        
        total_categories = categories_collection.count_documents({})
        total_pages = (total_categories + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        categories_cursor = categories_collection.find().sort("created_at", 1).skip(skip).limit(per_page)
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
                'total_categories': total_categories,
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
        
        existing_category = categories_collection.find_one({'name': data['name']})
        if existing_category:
            return jsonify({'error': 'Category name already exists'}), 400
        
        new_category = {
            'name': data['name'],
            'description': data.get('description', ''),
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
            product_count = products_collection.count_documents({'category_id': ObjectId(category_id)})
            if product_count > 0:
                return jsonify({
                    'error': f'Cannot rename category "{current_category["name"]}". {product_count} product(s) are using this category. Please reassign products first.'
                }), 400
        
        existing_category = categories_collection.find_one({
            'name': data['name'],
            '_id': {'$ne': ObjectId(category_id)}
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

@categories_bp.route('/api/categories/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        category = categories_collection.find_one({'_id': ObjectId(category_id)})
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        product_count = products_collection.count_documents({'category_id': ObjectId(category_id)})
        if product_count > 0:
            return jsonify({
                'error': f'Cannot delete category "{category["name"]}". {product_count} product(s) are using this category. Please delete or reassign products first.'
            }), 400
        
        service_count = service_types_collection.count_documents({'category_id': ObjectId(category_id)})
        if service_count > 0:
            return jsonify({
                'error': f'Cannot delete category "{category["name"]}". {service_count} service type(s) are using this category. Please reassign service types first.'
            }), 400
        
        result = categories_collection.delete_one({'_id': ObjectId(category_id)})
        if result.deleted_count:
            return jsonify({'message': 'Category deleted successfully'})
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@categories_bp.route('/api/categories/<category_id>/products', methods=['GET'])
def get_products_by_category(category_id):
    try:
        products = list(products_collection.find({'category_id': ObjectId(category_id)}).sort("product_name", 1))
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