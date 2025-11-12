from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for inventory reports
inventory_report_bp = Blueprint('inventory_report', __name__)

# MongoDB collections (will be initialized from app.py)
products_collection = None
categories_collection = None

def init_inventory_report_db(products_coll, categories_coll):
    """Initialize the collections from app.py"""
    global products_collection, categories_collection
    products_collection = products_coll
    categories_collection = categories_coll

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Helper function to determine stock status
def get_stock_status(stock_quantity, minimum_stock):
    stock_num = int(stock_quantity)
    min_stock = int(minimum_stock)
    
    if stock_num <= 0:
        return "Out of Stock"
    elif stock_num <= min_stock:
        return "Low Stock"
    else:
        return "In Stock"

# Inventory Report Endpoint
@inventory_report_bp.route('/reports/inventory', methods=['GET'])
def get_inventory_report():
    try:
        print(f"=== INVENTORY REPORT DEBUG ===")
        
        # Get all non-archived products
        products = list(products_collection.find({'is_archived': {'$ne': True}}))
        print(f"Found {len(products)} active products")
        
        # Initialize counters
        low_stock_items = []
        out_of_stock_items = []
        total_inventory_value = 0
        
        # Process each product
        current_stock = []
        for product in products:
            # Calculate stock value
            stock_quantity = int(product.get('stock_quantity', 0))
            unit_price = float(product.get('unit_price', 0))
            stock_value = stock_quantity * unit_price
            total_inventory_value += stock_value
            
            # Get category name
            category_name = 'Uncategorized'
            if product.get('category_id'):
                category = categories_collection.find_one({'_id': ObjectId(product['category_id'])})
                if category:
                    category_name = category.get('name', 'Uncategorized')
            elif product.get('category'):
                category_name = product['category']
            
            # Determine stock status
            minimum_stock = int(product.get('minimum_stock', 5))
            status = get_stock_status(stock_quantity, minimum_stock)
            
            # Create product data for response
            product_data = {
                '_id': str(product['_id']),
                'product_id': product.get('product_id', ''),
                'product_name': product.get('product_name', ''),
                'category_name': category_name,
                'stock_quantity': stock_quantity,
                'minimum_stock': minimum_stock,
                'unit_price': unit_price,
                'stock_value': stock_value,
                'status': status,
                'created_at': product.get('created_at'),
                'updated_at': product.get('updated_at')
            }
            
            current_stock.append(product_data)
            
            # Categorize by stock status
            if status == "Low Stock":
                low_stock_items.append(product_data)
            elif status == "Out of Stock":
                out_of_stock_items.append(product_data)
        
        # Calculate stock status summary
        stock_status = {
            'inStock': len([p for p in current_stock if p['status'] == 'In Stock']),
            'lowStock': len(low_stock_items),
            'outOfStock': len(out_of_stock_items)
        }
        
        print(f"Total Inventory Value: {total_inventory_value}")
        print(f"In Stock: {stock_status['inStock']}")
        print(f"Low Stock: {stock_status['lowStock']}")
        print(f"Out of Stock: {stock_status['outOfStock']}")
        print(f"=== END INVENTORY REPORT DEBUG ===")
        
        # Return the report data
        return jsonify({
            'currentStock': current_stock,
            'lowStockItems': low_stock_items,
            'outOfStockItems': out_of_stock_items,
            'totalValue': total_inventory_value,
            'stockStatus': stock_status
        })
        
    except Exception as e:
        print(f"Error generating inventory report: {str(e)}")
        return jsonify({'error': str(e)}), 500