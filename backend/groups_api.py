from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for groups routes
groups_bp = Blueprint('groups', __name__)

# MongoDB connection (will be initialized from app.py)
groups_collection = None

def init_groups_db(mongo_collection):
    """Initialize the groups collection from app.py"""
    global groups_collection
    groups_collection = mongo_collection

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Get all groups - UPDATED FOR PAGINATION
@groups_bp.route('/api/groups', methods=['GET'])
def get_groups():
    try:
        # Get pagination parameters from query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate skip value
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        total_groups = groups_collection.count_documents({})
        
        # Calculate total pages
        total_pages = (total_groups + per_page - 1) // per_page  # Ceiling division
        
        # If requested page is beyond available pages, go to last page
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        # Get paginated groups
        groups_cursor = groups_collection.find().skip(skip).limit(per_page)
        groups = list(groups_cursor)
        
        serialized_groups = [serialize_doc(group) for group in groups]
        
        # Return pagination info along with groups
        return jsonify({
            'groups': serialized_groups,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_groups': total_groups,
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single group by ID
@groups_bp.route('/api/groups/<group_id>', methods=['GET'])
def get_group(group_id):
    try:
        group = groups_collection.find_one({'_id': ObjectId(group_id)})
        if group:
            return jsonify(serialize_doc(group))
        return jsonify({'error': 'Group not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new group
@groups_bp.route('/api/groups', methods=['POST'])
def create_group():
    try:
        data = request.json
        
        # Check if group name already exists
        existing_group = groups_collection.find_one({'group_name': data['group_name']})
        if existing_group:
            return jsonify({'error': 'Group name already exists'}), 400
        
        new_group = {
            'group_name': data['group_name'],
            'group_level': int(data['group_level']),
            'status': data.get('status', 'Active'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = groups_collection.insert_one(new_group)
        new_group['_id'] = str(result.inserted_id)
        return jsonify(new_group), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update group
@groups_bp.route('/api/groups/<group_id>', methods=['PUT'])
def update_group(group_id):
    try:
        data = request.json
        
        # Check if group name already exists (excluding current group)
        existing_group = groups_collection.find_one({
            'group_name': data['group_name'],
            '_id': {'$ne': ObjectId(group_id)}
        })
        if existing_group:
            return jsonify({'error': 'Group name already exists'}), 400
        
        update_data = {
            'group_name': data['group_name'],
            'group_level': int(data['group_level']),
            'status': data['status'],
            'updated_at': datetime.utcnow()
        }
        
        result = groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Group updated successfully'})
        return jsonify({'error': 'Group not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete group
@groups_bp.route('/api/groups/<group_id>', methods=['DELETE'])
def delete_group(group_id):
    try:
        result = groups_collection.delete_one({'_id': ObjectId(group_id)})
        if result.deleted_count:
            return jsonify({'message': 'Group deleted successfully'})
        return jsonify({'error': 'Group not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500