from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for users routes
users_bp = Blueprint('users', __name__)

# MongoDB connection (will be initialized from app.py)
users_collection = None
groups_collection = None

def init_users_db(mongo_users_collection, mongo_groups_collection):
    """Initialize the collections from app.py"""
    global users_collection, groups_collection
    users_collection = mongo_users_collection
    groups_collection = mongo_groups_collection

# Helper to convert ObjectId to string and format dates
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        if 'group_id' in doc and doc['group_id']:
            doc['group_id'] = str(doc['group_id'])
        
        # Handle last_login date formatting
        if 'last_login' in doc and doc['last_login']:
            if isinstance(doc['last_login'], dict) and '$date' in doc['last_login']:
                # Handle ISODate format: {"$date": "2025-10-18T00:00:00Z"}
                doc['last_login'] = doc['last_login']['$date']
            elif isinstance(doc['last_login'], datetime):
                # Handle datetime object
                doc['last_login'] = doc['last_login'].isoformat() + 'Z'
        
        # Handle created_at and updated_at dates if needed
        for field in ['created_at', 'updated_at']:
            if field in doc and doc[field]:
                if isinstance(doc[field], dict) and '$date' in doc[field]:
                    doc[field] = doc[field]['$date']
                elif isinstance(doc[field], datetime):
                    doc[field] = doc[field].isoformat() + 'Z'
                    
    return doc

# Get all users with group names
@users_bp.route('/api/users', methods=['GET'])
def get_users():
    try:
        # Simple find with manual processing to handle date formats properly
        users_cursor = users_collection.find()
        users = []
        
        for user in users_cursor:
            # Look up group name separately
            if user.get('group_id'):
                group = groups_collection.find_one({'_id': ObjectId(user['group_id'])})
                user['role'] = group['group_name'] if group else 'Unknown'
            else:
                user['role'] = 'Unknown'
            
            users.append(user)
        
        serialized_users = [serialize_doc(user) for user in users]
        return jsonify(serialized_users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get available roles (from groups collection)
@users_bp.route('/api/users/roles', methods=['GET'])
def get_roles():
    try:
        groups = list(groups_collection.find({}, {'group_name': 1}))
        roles = [group['group_name'] for group in groups]
        return jsonify(roles)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new user
@users_bp.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.json
        
        # Get the group ID based on selected role
        group = groups_collection.find_one({'group_name': data['role']})
        if not group:
            return jsonify({'error': 'Invalid role selected'}), 400
        
        new_user = {
            'name': data['name'],
            'username': data['username'],
            'password': data['password'],
            'group_id': group['_id'],
            'status': data.get('status', 'Active'),
            'last_login': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Check if username already exists
        existing_user = users_collection.find_one({'username': data['username']})
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        result = users_collection.insert_one(new_user)
        new_user['_id'] = str(result.inserted_id)
        return jsonify(serialize_doc(new_user)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update user
@users_bp.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.json
        
        # Get the group ID based on selected role
        group = groups_collection.find_one({'group_name': data['role']})
        if not group:
            return jsonify({'error': 'Invalid role selected'}), 400
        
        update_data = {
            'name': data['name'],
            'username': data['username'],
            'group_id': group['_id'],
            'status': data['status'],
            'updated_at': datetime.utcnow()
        }
        
        # Only update password if provided
        if data.get('password'):
            update_data['password'] = data['password']
        
        # Check if username already exists (excluding current user)
        existing_user = users_collection.find_one({
            'username': data['username'],
            '_id': {'$ne': ObjectId(user_id)}
        })
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'User updated successfully'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update last login when user logs in
@users_bp.route('/api/users/<user_id>/last-login', methods=['PUT'])
def update_last_login(user_id):
    try:
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'last_login': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Last login updated successfully'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete user
@users_bp.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        if result.deleted_count:
            return jsonify({'message': 'User deleted successfully'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500