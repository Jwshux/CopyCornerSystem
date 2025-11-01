from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for groups routes
groups_bp = Blueprint('groups', __name__)

# MongoDB connection (will be initialized from app.py)
groups_collection = None
users_collection = None

def init_groups_db(mongo_collection, mongo_users_collection=None):
    """Initialize the groups collection from app.py"""
    global groups_collection, users_collection
    groups_collection = mongo_collection
    if mongo_users_collection is not None:
        users_collection = mongo_users_collection

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Get all groups - UPDATED FOR PAGINATION AND ARCHIVE
@groups_bp.route('/api/groups', methods=['GET'])
def get_groups():
    try:
        # Get pagination parameters from query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate skip value - Only fetch non-archived groups
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        query = {"is_archived": {"$ne": True}}
        total_groups = groups_collection.count_documents(query)
        
        # Calculate total pages
        total_pages = (total_groups + per_page - 1) // per_page  # Ceiling division
        
        # If requested page is beyond available pages, go to last page
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        # Get paginated groups
        groups_cursor = groups_collection.find(query).skip(skip).limit(per_page)
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

# GET ARCHIVED GROUPS
@groups_bp.route('/api/groups/archived', methods=['GET'])
def get_archived_groups():
    try:
        # Get pagination parameters from query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate skip value - Only fetch archived groups
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        query = {"is_archived": True}
        total_groups = groups_collection.count_documents(query)
        
        # Calculate total pages
        total_pages = (total_groups + per_page - 1) // per_page
        
        # If requested page is beyond available pages, go to last page
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        # Get paginated archived groups
        groups_cursor = groups_collection.find(query).sort("archived_at", -1).skip(skip).limit(per_page)
        groups = list(groups_cursor)
        
        serialized_groups = [serialize_doc(group) for group in groups]
        
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
        
        # Check if group name already exists (including archived ones)
        existing_group = groups_collection.find_one({
            'group_name': data['group_name'],
            'is_archived': {'$ne': True}
        })
        if existing_group:
            return jsonify({'error': 'Role name already exists'}), 400
        
        # Validate group level - ONLY 0 or 1
        group_level = int(data['group_level'])
        if group_level not in [0, 1]:
            return jsonify({'error': 'Role level must be 0 or 1'}), 400
        
        new_group = {
            'group_name': data['group_name'],
            'group_level': group_level,
            'status': data.get('status', 'Active'),
            'is_archived': False,
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
        
        # Check if group name already exists (excluding current group and archived ones)
        existing_group = groups_collection.find_one({
            'group_name': data['group_name'],
            '_id': {'$ne': ObjectId(group_id)},
            'is_archived': {'$ne': True}
        })
        if existing_group:
            return jsonify({'error': 'Role name already exists'}), 400
        
        # Validate group level - ONLY 0 or 1
        group_level = int(data['group_level'])
        if group_level not in [0, 1]:
            return jsonify({'error': 'Role level must be 0 or 1'}), 400
        
        update_data = {
            'group_name': data['group_name'],
            'group_level': group_level,
            'status': data['status'],
            'updated_at': datetime.utcnow()
        }
        
        result = groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Role updated successfully'})
        return jsonify({'error': 'Role not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ARCHIVE GROUP ENDPOINT - WITH DEPENDENCY CHECK
@groups_bp.route('/api/groups/<group_id>/archive', methods=['PUT'])
def archive_group(group_id):
    try:
        group = groups_collection.find_one({'_id': ObjectId(group_id)})
        if not group:
            return jsonify({'error': 'Role not found'}), 404
        
        # Check if group is being used by any active users
        active_users_count = users_collection.count_documents({
            'group_id': ObjectId(group_id),
            'is_archived': {'$ne': True}
        })
        
        if active_users_count > 0:
            # Get user details for the error message
            active_users = users_collection.find({
                'group_id': ObjectId(group_id),
                'is_archived': {'$ne': True}
            }).limit(5)  # Limit to 5 users for the error message
            
            user_details = []
            for user in active_users:
                user_details.append({
                    'username': user.get('username', 'Unknown'),
                    'name': user.get('name', 'Unknown')
                })
            
            return jsonify({
                'error': f'Cannot archive role. {active_users_count} user(s) are assigned to this role.',
                'user_count': active_users_count,
                'users': user_details
            }), 400
        
        # Archive the group
        result = groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$set': {
                'is_archived': True,
                'archived_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Role archived successfully'})
        return jsonify({'error': 'Failed to archive role'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# RESTORE GROUP ENDPOINT
@groups_bp.route('/api/groups/<group_id>/restore', methods=['PUT'])
def restore_group(group_id):
    try:
        # Check if group exists and is archived
        group = groups_collection.find_one({'_id': ObjectId(group_id)})
        if not group:
            return jsonify({'error': 'Role not found'}), 404
        
        if not group.get('is_archived'):
            return jsonify({'error': 'Role is not archived'}), 400
        
        # Check if group name already exists in active groups
        existing_group = groups_collection.find_one({
            'group_name': group['group_name'],
            '_id': {'$ne': ObjectId(group_id)},
            'is_archived': {'$ne': True}
        })
        if existing_group:
            return jsonify({'error': 'A role with this name already exists'}), 400
        
        # Restore the group
        result = groups_collection.update_one(
            {'_id': ObjectId(group_id)},
            {'$set': {
                'is_archived': False,
                'restored_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Role restored successfully'})
        return jsonify({'error': 'Failed to restore role'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete group
@groups_bp.route('/api/groups/<group_id>', methods=['DELETE'])
def delete_group(group_id):
    try:
        result = groups_collection.delete_one({'_id': ObjectId(group_id)})
        if result.deleted_count:
            return jsonify({'message': 'Role deleted successfully'})
        return jsonify({'error': 'Role not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500