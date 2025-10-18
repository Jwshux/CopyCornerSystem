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

# Get all groups
@groups_bp.route('/api/groups', methods=['GET'])
def get_groups():
    try:
        groups = list(groups_collection.find())
        serialized_groups = [serialize_doc(group) for group in groups]
        return jsonify(serialized_groups)
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