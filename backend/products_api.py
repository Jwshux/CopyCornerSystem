from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

products_bp = Blueprint('products', __name__)

products_collection = None
categories_collection = None
transactions_collection = None

def init_products_db(mongo_collection):
    global products_collection
    products_collection = mongo_collection

def init_products_relationships(categories_coll, transactions_coll):
    global categories_collection, transactions_collection
    categories_collection = categories_coll
    transactions_collection = transactions_coll

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

def get_stock_status(stock_quantity, minimum_stock):
    stock_num = int(stock_quantity)
    min_stock = int(minimum_stock)
    
    if stock_num <= 0:
        return "Out of Stock"
    elif stock_num <= min_stock:
        return "Low Stock"
    else:
        return "In Stock"

def generate_product_id():
    products = list(products_collection.find({"is_archived": {"$ne": True}}).sort("created_at", 1))
    if not products:
        return "PROD_001"
    
    count = products_collection.count_documents({"is_archived": {"$ne": True}})
    return f"PROD_{count + 1:03d}"

def renumber_products():
    try:
        products = list(products_collection.find({"is_archived": {"$ne": True}}).sort("created_at", 1))
        
        for index, product in enumerate(products, 1):
            new_product_id = f"PROD_{index:03d}"
            products_collection.update_one(
                {'_id': product['_id']},
                {'$set': {'product_id': new_product_id}}
            )
        
        return True
    except Exception as e:
        print(f"Error renumbering products: {e}")
        return False

@products_bp.route('/api/products', methods=['GET'])
def get_products():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        # Only fetch non-archived products
        query = {'is_archived': {'$ne': True}}
        total_products = products_collection.count_documents(query)
        total_pages = (total_products + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        products_cursor = products_collection.find(query).sort("created_at", 1).skip(skip).limit(per_page)
        products = list(products_cursor)
        
        for product in products:
            # Handle both old 'category' field and new 'category_id' relationship
            if product.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(product['category_id'])})
                product['category_name'] = category['name'] if category else 'Unknown'
            elif product.get('category'):
                # Fallback to old category field
                product['category_name'] = product['category']
            else:
                product['category_name'] = 'Uncategorized'
        
        serialized_products = [serialize_doc(product) for product in products]
        
        return jsonify({
            'products': serialized_products,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_products': total_products,
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if product:
            # Handle both old 'category' field and new 'category_id' relationship
            if product.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(product['category_id'])})
                product['category_data'] = serialize_doc(category) if category else None
                product['category_name'] = category['name'] if category else 'Unknown'
            elif product.get('category'):
                # Fallback to old category field
                product['category_name'] = product['category']
            
            transaction_count = transactions_collection.count_documents({
                '$or': [
                    {'paper_type': product['product_name']},
                    {'size_type': product['product_name']},
                    {'supply_type': product['product_name']}
                ]
            })
            product['transaction_count'] = transaction_count
            
            return jsonify(serialize_doc(product))
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/api/products', methods=['POST'])
def create_product():
    try:
        data = request.json
        
        existing_product = products_collection.find_one({
            'product_name': data['product_name'],
            'is_archived': {'$ne': True}
        })
        if existing_product:
            return jsonify({'error': 'Product name already exists'}), 400
        
        if data.get('category_id'):
            category = categories_collection.find_one({'_id': ObjectId(data['category_id'])})
            if not category:
                return jsonify({'error': 'Category not found'}), 400
        
        product_id = generate_product_id()
        status = get_stock_status(data['stock_quantity'], data['minimum_stock'])
        
        new_product = {
            'product_id': product_id,
            'product_name': data['product_name'],
            'category_id': ObjectId(data['category_id']) if data.get('category_id') else None,
            'category': data.get('category', ''),
            'stock_quantity': int(data['stock_quantity']),
            'minimum_stock': int(data['minimum_stock']),
            'unit_price': float(data['unit_price']),
            'status': status,
            'is_archived': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = products_collection.insert_one(new_product)
        
        inserted_product = products_collection.find_one({'_id': result.inserted_id})
        
        if not inserted_product:
            return jsonify({'error': 'Failed to create product'}), 500
            
        if inserted_product.get('category_id'):
            category = categories_collection.find_one({'_id': ObjectId(inserted_product['category_id'])})
            inserted_product['category_name'] = category['name'] if category else 'Unknown'
        elif inserted_product.get('category'):
            inserted_product['category_name'] = inserted_product['category']
        
        serialized_product = serialize_doc(inserted_product)
        return jsonify(serialized_product), 201
        
    except Exception as e:
        print(f"Error creating product: {str(e)}")
        return jsonify({'error': str(e)}), 500

@products_bp.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        
        existing_product = products_collection.find_one({
            'product_name': data['product_name'],
            '_id': {'$ne': ObjectId(product_id)},
            'is_archived': {'$ne': True}
        })
        if existing_product:
            return jsonify({'error': 'Product name already exists'}), 400
        
        if data.get('category_id'):
            category = categories_collection.find_one({'_id': ObjectId(data['category_id'])})
            if not category:
                return jsonify({'error': 'Category not found'}), 400
        
        status = get_stock_status(data['stock_quantity'], data['minimum_stock'])
        
        update_data = {
            'product_name': data['product_name'],
            'category_id': ObjectId(data['category_id']) if data.get('category_id') else None,
            'category': data.get('category', ''),
            'stock_quantity': int(data['stock_quantity']),
            'minimum_stock': int(data['minimum_stock']),
            'unit_price': float(data['unit_price']),
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        result = products_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            updated_product = products_collection.find_one({'_id': ObjectId(product_id)})
            if updated_product:
                if updated_product.get('category_id'):
                    category = categories_collection.find_one({'_id': ObjectId(updated_product['category_id'])})
                    updated_product['category_name'] = category['name'] if category else 'Unknown'
                
                serialized_product = serialize_doc(updated_product)
                return jsonify(serialized_product)
            
            return jsonify({'message': 'Product updated successfully'})
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        print(f"Error updating product: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ARCHIVE PRODUCT ENDPOINT
@products_bp.route('/api/products/<product_id>/archive', methods=['PUT'])
def archive_product(product_id):
    try:
        # Check if product exists
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Update product to set as archived
        result = products_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': {
                'is_archived': True,
                'archived_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            # Renumber remaining products
            renumber_products()
            return jsonify({'message': 'Product archived successfully'})
        return jsonify({'error': 'Failed to archive product'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# RESTORE PRODUCT ENDPOINT
@products_bp.route('/api/products/<product_id>/restore', methods=['PUT'])
def restore_product(product_id):
    try:
        # Check if product exists and is archived
        product = products_collection.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if not product.get('is_archived'):
            return jsonify({'error': 'Product is not archived'}), 400
        
        # Check if the category for this product exists and is active
        if product.get('category_id'):
            # First check if category exists in active categories
            category = categories_collection.find_one({
                '_id': ObjectId(product['category_id']),
                'is_archived': {'$ne': True}  # Category must be active
            })
            
            if not category:
                # If not found in active categories, check archived categories to get the actual name
                archived_category = categories_collection.find_one({
                    '_id': ObjectId(product['category_id']),
                    'is_archived': True
                })
                
                category_name = "Unknown"
                if archived_category:
                    category_name = archived_category['name']
                
                return jsonify({
                    'error': f'Cannot restore product. Category "{category_name}" is archived. Please restore the category first.'
                }), 400
        
        # Check if product name already exists in active products
        existing_product = products_collection.find_one({
            'product_name': product['product_name'],
            '_id': {'$ne': ObjectId(product_id)},
            'is_archived': {'$ne': True}
        })
        if existing_product:
            return jsonify({'error': 'A product with this name already exists'}), 400
        
        # Restore the product
        result = products_collection.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': {
                'is_archived': False,
                'restored_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            # Renumber products after restoration
            renumber_products()
            return jsonify({'message': 'Product restored successfully'})
        return jsonify({'error': 'Failed to restore product'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/api/products/category/<category_id>', methods=['GET'])
def get_products_by_category_id(category_id):
    try:
        # Only get non-archived products
        products = list(products_collection.find({
            'category_id': ObjectId(category_id),
            'is_archived': {'$ne': True}
        }).sort("product_name", 1))
        
        for product in products:
            if product.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(product['category_id'])})
                product['category_name'] = category['name'] if category else 'Unknown'
        
        serialized_products = [serialize_doc(product) for product in products]
        return jsonify(serialized_products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@products_bp.route('/api/products/renumber', methods=['POST'])
def renumber_all_products():
    try:
        if renumber_products():
            return jsonify({'message': 'All products renumbered successfully'})
        else:
            return jsonify({'error': 'Failed to renumber products'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GET ARCHIVED PRODUCTS
@products_bp.route('/api/products/archived', methods=['GET'])
def get_archived_products():
    try:
        products = list(products_collection.find({'is_archived': True}).sort("archived_at", -1))
        
        for product in products:
            if product.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(product['category_id'])})
                product['category_name'] = category['name'] if category else 'Unknown'
            elif product.get('category'):
                product['category_name'] = product['category']
        
        serialized_products = [serialize_doc(product) for product in products]
        return jsonify(serialized_products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500