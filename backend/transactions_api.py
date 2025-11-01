from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os

transactions_bp = Blueprint('transactions', __name__)

transactions_collection = None
products_collection = None
service_types_collection = None
categories_collection = None

def init_transactions_db(mongo_collection, products_coll):
    global transactions_collection, products_collection
    transactions_collection = mongo_collection
    products_collection = products_coll

def init_transactions_relationships(service_types_coll, categories_coll):
    global service_types_collection, categories_collection
    service_types_collection = service_types_coll
    categories_collection = categories_coll

def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

def get_ph_time():
    utc_now = datetime.utcnow()
    ph_time = utc_now + timedelta(hours=8)
    return ph_time

def generate_transaction_id():
    transactions = list(transactions_collection.find({"is_archived": {"$ne": True}}).sort("created_at", 1))
    if not transactions:
        return "T-001"
    
    count = transactions_collection.count_documents({"is_archived": {"$ne": True}})
    return f"T-{count + 1:03d}"

def generate_queue_number():
    transactions = list(transactions_collection.find({"is_archived": {"$ne": True}}).sort("created_at", 1))
    if not transactions:
        return "001"
    
    count = transactions_collection.count_documents({"is_archived": {"$ne": True}})
    return f"{count + 1:03d}"

def update_product_inventory(product_name, total_pages, quantity, service_type):
    try:
        if not product_name or not quantity:
            return False
            
        product = products_collection.find_one({"product_name": product_name})
        if not product:
            print(f"Product not found: {product_name}")
            return False
        
        if service_type in ["Printing", "Photocopying", "Thesis Hardbound", "Softbind"]:
            items_to_deduct = total_pages * quantity
        elif service_type in ["Tshirt Printing", "School Supplies"]:
            items_to_deduct = quantity
        else:
            items_to_deduct = quantity
        
        new_stock = max(0, product['stock_quantity'] - items_to_deduct)
        
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

@transactions_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        # Only fetch non-archived transactions
        query = {"is_archived": {"$ne": True}}
        
        total_transactions = transactions_collection.count_documents(query)
        total_pages = (total_transactions + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        transactions_cursor = transactions_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        transactions = list(transactions_cursor)
        
        for transaction in transactions:
            if transaction.get('service_type'):
                service_type = service_types_collection.find_one({'service_name': transaction['service_type']})
                if service_type and service_type.get('category_id'):
                    category = categories_collection.find_one({'_id': service_type['category_id']})
                    transaction['service_category'] = category['name'] if category else 'Unknown'
                else:
                    transaction['service_category'] = 'Uncategorized'
            else:
                transaction['service_category'] = 'Unknown'
        
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

# GET ARCHIVED TRANSACTIONS
@transactions_bp.route('/api/transactions/archived', methods=['GET'])
def get_archived_transactions():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        query = {"is_archived": True}
        
        total_transactions = transactions_collection.count_documents(query)
        total_pages = (total_transactions + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        transactions_cursor = transactions_collection.find(query).sort("archived_at", -1).skip(skip).limit(per_page)
        transactions = list(transactions_cursor)
        
        for transaction in transactions:
            if transaction.get('service_type'):
                service_type = service_types_collection.find_one({'service_name': transaction['service_type']})
                if service_type and service_type.get('category_id'):
                    category = categories_collection.find_one({'_id': service_type['category_id']})
                    transaction['service_category'] = category['name'] if category else 'Unknown'
        
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

@transactions_bp.route('/api/transactions/<transaction_id>', methods=['GET'])
def get_transaction(transaction_id):
    try:
        transaction = transactions_collection.find_one({'_id': ObjectId(transaction_id)})
        if transaction:
            if transaction.get('service_type'):
                service_type = service_types_collection.find_one({'service_name': transaction['service_type']})
                if service_type:
                    transaction['service_type_data'] = serialize_doc(service_type)
                    if service_type.get('category_id'):
                        category = categories_collection.find_one({'_id': service_type['category_id']})
                        transaction['service_category_data'] = serialize_doc(category) if category else None
            
            if transaction.get('paper_type'):
                product = products_collection.find_one({'product_name': transaction['paper_type']})
                transaction['paper_type_data'] = serialize_doc(product) if product else None
            
            if transaction.get('size_type'):
                product = products_collection.find_one({'product_name': transaction['size_type']})
                transaction['size_type_data'] = serialize_doc(product) if product else None
            
            if transaction.get('supply_type'):
                product = products_collection.find_one({'product_name': transaction['supply_type']})
                transaction['supply_type_data'] = serialize_doc(product) if product else None
            
            return jsonify(serialize_doc(transaction))
        return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/api/transactions', methods=['POST'])
def create_transaction():
    try:
        data = request.json
        
        queue_number = generate_queue_number()
        transaction_id = generate_transaction_id()
        
        price_per_unit = float(data.get('price_per_unit', 0))
        quantity = int(data.get('quantity', 1))
        total_amount = float(data.get('total_amount', price_per_unit * quantity))
        
        ph_now = get_ph_time()
        auto_date = ph_now.strftime('%Y-%m-%d')
        
        new_transaction = {
            'queue_number': queue_number,
            'transaction_id': transaction_id,
            'customer_name': data['customer_name'],
            'service_type': data['service_type'],
            'paper_type': data.get('paper_type', ''),
            'size_type': data.get('size_type', ''),
            'supply_type': data.get('supply_type', ''),
            'total_pages': int(data.get('total_pages', 0)),
            'price_per_unit': price_per_unit,
            'quantity': quantity,
            'total_amount': total_amount,
            'date': auto_date,
            'status': 'Pending',  # Always set to Pending when created
            'is_archived': False,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = transactions_collection.insert_one(new_transaction)
        new_transaction['_id'] = str(result.inserted_id)
        
        return jsonify(new_transaction), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    try:
        data = request.json
        
        current_transaction = transactions_collection.find_one({'_id': ObjectId(transaction_id)})
        if not current_transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
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
            # Handle inventory update when status changes to Completed
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

# ARCHIVE TRANSACTION ENDPOINT
@transactions_bp.route('/api/transactions/<transaction_id>/archive', methods=['PUT'])
def archive_transaction(transaction_id):
    try:
        transaction = transactions_collection.find_one({'_id': ObjectId(transaction_id)})
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        # Archive the transaction
        result = transactions_collection.update_one(
            {'_id': ObjectId(transaction_id)},
            {'$set': {
                'is_archived': True,
                'archived_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Transaction archived successfully'})
        return jsonify({'error': 'Failed to archive transaction'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# RESTORE TRANSACTION ENDPOINT - FIXED
@transactions_bp.route('/api/transactions/<transaction_id>/restore', methods=['PUT'])
def restore_transaction(transaction_id):
    try:
        # Check if transaction exists and is archived
        transaction = transactions_collection.find_one({'_id': ObjectId(transaction_id)})
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        if not transaction.get('is_archived'):
            return jsonify({'error': 'Transaction is not archived'}), 400
        
        # Check if the service type for this transaction exists and is active
        service_type = service_types_collection.find_one({
            'service_name': transaction['service_type'],
            'is_archived': {'$ne': True}  # Service type must be active
        })
        if not service_type:
            return jsonify({
                'error': f'Cannot restore transaction. Service type "{transaction["service_type"]}" is archived. Please restore the service type first.'
            }), 400
        
        # Restore the transaction
        result = transactions_collection.update_one(
            {'_id': ObjectId(transaction_id)},
            {'$set': {
                'is_archived': False,
                'restored_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Transaction restored successfully'})
        return jsonify({'error': 'Failed to restore transaction'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    try:
        result = transactions_collection.delete_one({'_id': ObjectId(transaction_id)})
        if result.deleted_count:
            return jsonify({'message': 'Transaction deleted successfully'})
        return jsonify({'error': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/api/transactions/status/<status>', methods=['GET'])
def get_transactions_by_status(status):
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        query = {'status': status, "is_archived": {"$ne": True}}
        
        total_transactions = transactions_collection.count_documents(query)
        total_pages = (total_transactions + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        transactions_cursor = transactions_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        transactions = list(transactions_cursor)
        
        for transaction in transactions:
            if transaction.get('service_type'):
                service_type = service_types_collection.find_one({'service_name': transaction['service_type']})
                if service_type and service_type.get('category_id'):
                    category = categories_collection.find_one({'_id': service_type['category_id']})
                    transaction['service_category'] = category['name'] if category else 'Unknown'
                else:
                    transaction['service_category'] = 'Uncategorized'
            else:
                transaction['service_category'] = 'Unknown'
        
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

@transactions_bp.route('/api/transactions/service-type/<service_type_name>', methods=['GET'])
def get_transactions_by_service_type(service_type_name):
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        skip = (page - 1) * per_page
        
        query = {'service_type': service_type_name, "is_archived": {"$ne": True}}
        
        total_transactions = transactions_collection.count_documents(query)
        total_pages = (total_transactions + per_page - 1) // per_page
        
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        transactions_cursor = transactions_collection.find(query).sort("created_at", -1).skip(skip).limit(per_page)
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