from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for products routes
products_bp = Blueprint('products', __name__)

# MongoDB connection (will be initialized from app.py)
products_collection = None

def init_products_db(mongo_collection):
    """Initialize the products collection from app.py"""
    global products_collection
    products_collection = mongo_collection

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Calculate stock status based on quantity
def get_stock_status(stock_quantity):
    stock_num = int(stock_quantity)
    if stock_num <= 0:
        return "Out of Stock"
    elif stock_num <= 5:
        return "Low Stock"
    else:
        return "In Stock"

# Get all products
@products_bp.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = list(products_collection.find())
        serialized_products = [serialize_doc(product) for product in products]
        return jsonify(serialized_products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single product by ID
@products_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if product:
            return jsonify(serialize_doc(product))
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new product
@products_bp.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.json
        
        # Check if product name already exists
        existing_product = products_collection.find_one({'product_name': data['product_name']})
        if existing_product:
            return jsonify({'error': 'Product name already exists'}), 400
        
        # Auto-generate product_id
        last_product = products_collection.find_one(sort=[("_id", -1)])
        last_id = int(last_product['product_id'].split('-')[1]) if last_product else 0
        new_product_id = f"PROD-{last_id + 1:03d}"
        
        # Calculate status based on stock
        status = get_stock_status(data['stock_quantity'])
        
        new_product = {
            'product_id': new_product_id,
            'product_name': data['product_name'],
            'category': data['category'],
            'stock_quantity': int(data['stock_quantity']),
            'unit_price': float(data['unit_price']),
            'status': status,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = products_collection.insert_one(new_product)
        new_product['_id'] = str(result.inserted_id)
        return jsonify(new_product), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update product
@products_bp.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        
        # Check if product name already exists (excluding current product)
        existing_product = products_collection.find_one({
            'product_name': data['product_name'],
            '_id': {'$ne': ObjectId(product_id)}
        })
        if existing_product:
            return jsonify({'error': 'Product name already exists'}), 400
        
        # Calculate status based on stock
        status = get_stock_status(data['stock_quantity'])
        
        update_data = {
            'product_name': data['product_name'],
            'category': data['category'],
            'stock_quantity': int(data['stock_quantity']),
            'unit_price': float(data['unit_price']),
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        result = products_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Product updated successfully'})
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete product
@products_bp.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        result = products_collection.delete_one({'_id': ObjectId(product_id)})
        if result.deleted_count:
            return jsonify({'message': 'Product deleted successfully'})
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500