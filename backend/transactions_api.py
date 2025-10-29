from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for transactions routes
transactions_bp = Blueprint('transactions', __name__)

# MongoDB connection (will be initialized from app.py)
transactions_collection = None
products_collection = None

def init_transactions_db(mongo_collection, products_coll):
    """Initialize the transactions and products collections from app.py"""
    global transactions_collection, products_collection
    transactions_collection = mongo_collection
    products_collection = products_coll

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Generate sequential transaction ID
def generate_transaction_id():
    transactions = list(transactions_collection.find().sort("created_at", 1))
    if not transactions:
        return "T-001"
    
    # Count existing transactions for sequential numbering
    count = transactions_collection.count_documents({})
    return f"T-{count + 1:03d}"

# Generate sequential queue number
def generate_queue_number():
    transactions = list(transactions_collection.find().sort("created_at", 1))
    if not transactions:
        return "001"
    
    # Count existing transactions for sequential numbering
    count = transactions_collection.count_documents({})
    return f"{count + 1:03d}"

# Update product inventory - UPDATED FOR ALL SERVICES
def update_product_inventory(product_name, total_pages, quantity, service_type):
    """Deduct used products from inventory"""
    try:
        if not product_name or not quantity:
            return False
            
        # Find the product by name
        product = products_collection.find_one({"product_name": product_name})
        if not product:
            print(f"Product not found: {product_name}")
            return False
        
        # Calculate items to deduct
        if service_type in ["Printing", "Photocopying", "Thesis Hardbound", "Softbind"]:
            # Paper services: deduct pages × quantity
            items_to_deduct = total_pages * quantity
        elif service_type in ["Tshirt Printing", "School Supplies"]:
            # T-shirt and Supplies services: deduct quantity only
            items_to_deduct = quantity
        else:
            items_to_deduct = quantity
        
        # Update stock quantity
        new_stock = max(0, product['stock_quantity'] - items_to_deduct)
        
        # Update status based on new stock
        if new_stock <= 0:
            status = "Out of Stock"
        elif new_stock <= 5:
            status = "Low Stock"
        else:
            status = "In Stock"
        
        result = products_collection.update_one(
            {'_id': product['_id']},
            {'$set': {
                'stock_quantity': new_stock,
                'status': status,
                'updated_at': datetime.utcnow()
            }}
        )
        
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating inventory: {e}")
        return False

# Get all transactions - WITH PAGINATION
@transactions_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        # Get pagination parameters from query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate skip value
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        total_transactions = transactions_collection.count_documents({})
        
        # Calculate total pages
        total_pages = (total_transactions + per_page - 1) // per_page  # Ceiling division
        
        # If requested page is beyond available pages, go to last page
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        # Get paginated transactions
        transactions_cursor = transactions_collection.find().sort("created_at", -1).skip(skip).limit(per_page)
        transactions = list(transactions_cursor)
        
        serialized_transactions = [serialize_doc(transaction) for transaction in transactions]
        
        # Return pagination info along with transactions
        return jsonify({
            'transactions': serialized_transactions,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_transactions': total_transactions,
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single transaction by ID
@transactions_bp.route('/api/transactions/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    try:
        transaction = transactions_collection.find_one({'_id': ObjectId(transaction_id)})
        if transaction:
            return jsonify(serialize_doc(transaction))
        return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new transaction
@transactions_bp.route('/api/transactions', methods=['POST'])
def create_transaction():
    try:
        data = request.json
        
        # Generate IDs
        queue_number = generate_queue_number()
        transaction_id = generate_transaction_id()
        
        # Calculate total amount if not provided
        price_per_unit = float(data.get('price_per_unit', 0))
        quantity = int(data.get('quantity', 1))
        total_amount = float(data.get('total_amount', price_per_unit * quantity))
        
        new_transaction = {
            'queue_number': queue_number,
            'transaction_id': transaction_id,
            'customer_name': data['customer_name'],
            'service_type': data['service_type'],
            'paper_type': data.get('paper_type', ''),
            'size_type': data.get('size_type', ''),
            'supply_type': data.get('supply_type', ''),  # NEW FIELD
            'total_pages': int(data.get('total_pages', 0)),
            'price_per_unit': price_per_unit,
            'quantity': quantity,
            'total_amount': total_amount,
            'date': data.get('date', datetime.utcnow().strftime('%Y-%m-%d')),
            'status': data.get('status', 'Pending'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = transactions_collection.insert_one(new_transaction)
        new_transaction['_id'] = str(result.inserted_id)
        
        # Update inventory if transaction is completed and involves consumable products
        if (new_transaction['status'] == 'Completed'):
            product_name = ""
            if new_transaction['paper_type']:
                product_name = new_transaction['paper_type']
            elif new_transaction['size_type']:
                product_name = new_transaction['size_type']
            elif new_transaction['supply_type']:
                product_name = new_transaction['supply_type']
            
            if product_name:
                update_product_inventory(
                    product_name,
                    new_transaction['total_pages'],
                    new_transaction['quantity'],
                    new_transaction['service_type']
                )
        
        return jsonify(new_transaction), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update transaction
@transactions_bp.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    try:
        data = request.json
        
        # Get current transaction to check status changes
        current_transaction = transactions_collection.find_one({'_id': ObjectId(transaction_id)})
        if not current_transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Calculate total amount if not provided
        price_per_unit = float(data.get('price_per_unit', current_transaction.get('price_per_unit', 0)))
        quantity = int(data.get('quantity', current_transaction.get('quantity', 1)))
        total_amount = float(data.get('total_amount', price_per_unit * quantity))
        
        update_data = {
            'customer_name': data.get('customer_name', current_transaction.get('customer_name')),
            'service_type': data.get('service_type', current_transaction.get('service_type')),
            'paper_type': data.get('paper_type', current_transaction.get('paper_type', '')),
            'size_type': data.get('size_type', current_transaction.get('size_type', '')),
            'supply_type': data.get('supply_type', current_transaction.get('supply_type', '')),
            'total_pages': int(data.get('total_pages', current_transaction.get('total_pages', 0))),
            'price_per_unit': price_per_unit,
            'quantity': quantity,
            'total_amount': total_amount,
            'date': data.get('date', current_transaction.get('date')),
            'status': data.get('status', current_transaction.get('status')),
            'updated_at': datetime.utcnow()
        }
        
        result = transactions_collection.update_one(
            {'_id': ObjectId(transaction_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            # Update inventory if status changed to Completed and involves products
            if (current_transaction.get('status') != 'Completed' and 
                update_data['status'] == 'Completed'):
                
                product_name = ""
                if update_data['paper_type']:
                    product_name = update_data['paper_type']
                elif update_data['size_type']:
                    product_name = update_data['size_type']
                elif update_data['supply_type']:
                    product_name = update_data['supply_type']
                
                if product_name:
                    update_product_inventory(
                        product_name,
                        update_data['total_pages'],
                        update_data['quantity'],
                        update_data['service_type']
                    )
            
            return jsonify({'message': 'Transaction updated successfully'})
        return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete transaction
@transactions_bp.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    try:
        result = transactions_collection.delete_one({'_id': ObjectId(transaction_id)})
        if result.deleted_count:
            return jsonify({'message': 'Transaction deleted successfully'})
        return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get transactions by status (for filtering)
@transactions_bp.route('/api/transactions/status/<status>', methods=['GET'])
def get_transactions_by_status(status):
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        total_transactions = transactions_collection.count_documents({'status': status})
        total_pages = (total_transactions + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        transactions_cursor = transactions_collection.find({'status': status}).sort("created_at", -1).skip(skip).limit(per_page)
        transactions = list(transactions_cursor)
        
        serialized_transactions = [serialize_doc(transaction) for transaction in transactions]
        
        return jsonify({
            'transactions': serialized_transactions,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_transactions': total_transactions,
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500