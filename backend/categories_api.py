from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for categories routes
categories_bp = Blueprint('categories', __name__)

# MongoDB connection (will be initialized from app.py)
categories_collection = None

def init_categories_db(mongo_collection):
    """Initialize the categories collection from app.py"""
    global categories_collection
    categories_collection = mongo_collection

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Get all categories
@categories_bp.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = list(categories_collection.find())
        serialized_categories = [serialize_doc(category) for category in categories]
        return jsonify(serialized_categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single category by ID
@categories_bp.route('/api/categories/<category_id>', methods=['GET'])
def get_category(category_id):
    try:
        category = categories_collection.find_one({'_id': ObjectId(category_id)})
        if category:
            return jsonify(serialize_doc(category))
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new category
@categories_bp.route('/api/categories', methods=['POST'])
def create_category():
    try:
        data = request.json
        
        # Check if category name already exists
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

# Update category
@categories_bp.route('/api/categories/<category_id>', methods=['PUT'])
def update_category(category_id):
    try:
        data = request.json
        
        # Check if category name already exists (excluding current category)
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

# Delete category
@categories_bp.route('/api/categories/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    try:
        result = categories_collection.delete_one({'_id': ObjectId(category_id)})
        if result.deleted_count:
            return jsonify({'message': 'Category deleted successfully'})
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500