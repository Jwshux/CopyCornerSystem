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
staffs_collection = None
schedules_collection = None  # ADD THIS

def init_users_db(mongo_users_collection, mongo_groups_collection, mongo_staffs_collection, mongo_schedules_collection):  # UPDATE THIS
    """Initialize the collections from app.py"""
    global users_collection, groups_collection, staffs_collection, schedules_collection  # UPDATE THIS
    users_collection = mongo_users_collection
    groups_collection = mongo_groups_collection
    staffs_collection = mongo_staffs_collection
    schedules_collection = mongo_schedules_collection  # ADD THIS

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

# Get all users with group names - UPDATED FOR PAGINATION
@users_bp.route('/api/users', methods=['GET'])
def get_users():
    try:
        # Get pagination parameters from query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate skip value
        skip = (page - 1) * per_page
        
        # Get total count for pagination info
        total_users = users_collection.count_documents({})
        
        # Calculate total pages
        total_pages = (total_users + per_page - 1) // per_page  # Ceiling division
        
        # If requested page is beyond available pages, go to last page
        if page > total_pages and total_pages > 0:
            page = total_pages
            skip = (page - 1) * per_page
        
        # Get paginated users
        users_cursor = users_collection.find().skip(skip).limit(per_page)
        users = []
        
        for user in users_cursor:
            # Look up group name separately
            if user.get('group_id'):
                group = groups_collection.find_one({'_id': ObjectId(user['group_id'])})
                user['role'] = group['group_name'] if group else 'Unknown'
            else:
                user['role'] = 'Unknown'
            
            # For staff users, get staff details
            if group and 'staff' in group['group_name'].lower():
                staff = staffs_collection.find_one({'user_id': user['_id']})
                if staff:
                    user['studentNumber'] = staff.get('studentNumber', '')
                    user['course'] = staff.get('course', '')
                    user['section'] = staff.get('section', '')
                else:
                    user['studentNumber'] = ''
                    user['course'] = ''
                    user['section'] = ''
            else:
                user['studentNumber'] = ''
                user['course'] = ''
                user['section'] = ''
            
            users.append(user)
        
        serialized_users = [serialize_doc(user) for user in users]
        
        # Return pagination info along with users
        return jsonify({
            'users': serialized_users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_users': total_users,
                'total_pages': total_pages
            }
        })
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
        
        # If role is staff, create staff record
        if 'staff' in data['role'].lower():
            staff_data = {
                'user_id': result.inserted_id,
                'studentNumber': data.get('studentNumber', ''),
                'course': data.get('course', ''),
                'section': data.get('section', ''),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            staffs_collection.insert_one(staff_data)
        
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
        
        # Get current user data
        current_user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # CHECK: If changing status to Inactive AND user is staff, verify no active schedules
        if (data.get('status') == 'Inactive' and current_user.get('status') == 'Active' and 
            'staff' in data['role'].lower()):
            
            # Check if staff has any active schedules
            active_schedule_count = schedules_collection.count_documents({
                'staff_id': ObjectId(user_id)
            })
            
            if active_schedule_count > 0:
                # Get schedule details for the error message
                active_schedules = schedules_collection.find({
                    'staff_id': ObjectId(user_id)
                })
                
                schedule_details = []
                for schedule in active_schedules:
                    schedule_details.append({
                        'day': schedule.get('day', 'Unknown'),
                        'start_time': schedule.get('start_time', ''),
                        'end_time': schedule.get('end_time', '')
                    })
                
                return jsonify({
                    'error': f'Cannot set staff to inactive. {active_schedule_count} schedule(s) are using this staff member.',
                    'schedule_count': active_schedule_count,
                    'schedules': schedule_details
                }), 400
        
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
        
        # Handle staff record based on role
        if 'staff' in data['role'].lower():
            # User is staff - update or create staff record
            staff_update_data = {
                'studentNumber': data.get('studentNumber', ''),
                'course': data.get('course', ''),
                'section': data.get('section', ''),
                'updated_at': datetime.utcnow()
            }
            
            # Update existing staff record or create new one
            staffs_collection.update_one(
                {'user_id': ObjectId(user_id)},
                {'$set': staff_update_data},
                upsert=True  # Create if doesn't exist
            )
        else:
            # User is not staff - remove staff record if it exists
            staffs_collection.delete_one({'user_id': ObjectId(user_id)})
        
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
        # Check if user has any active schedules (if they are staff)
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if user:
            group = groups_collection.find_one({'_id': user['group_id']})
            if group and 'staff' in group['group_name'].lower():
                # Check if staff has any active schedules
                active_schedule_count = schedules_collection.count_documents({
                    'staff_id': ObjectId(user_id)
                })
                
                if active_schedule_count > 0:
                    # Get schedule details for the error message
                    active_schedules = schedules_collection.find({
                        'staff_id': ObjectId(user_id)
                    })
                    
                    schedule_details = []
                    for schedule in active_schedules:
                        schedule_details.append({
                            'day': schedule.get('day', 'Unknown'),
                            'start_time': schedule.get('start_time', ''),
                            'end_time': schedule.get('end_time', '')
                        })
                    
                    return jsonify({
                        'error': f'Cannot delete staff. {active_schedule_count} schedule(s) are assigned to this staff member.',
                        'schedule_count': active_schedule_count,
                        'schedules': schedule_details
                    }), 400
        
        # Delete staff record first if it exists
        staffs_collection.delete_one({'user_id': ObjectId(user_id)})
        
        # Then delete user
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        if result.deleted_count:
            return jsonify({'message': 'User deleted successfully'})
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# Add this route to users_api.py
@users_bp.route('/api/users/<user_id>/role-level', methods=['GET'])
def get_user_role_level(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get the group to find role level
        group = groups_collection.find_one({'_id': user['group_id']})
        if not group:
            return jsonify({'error': 'User role not found'}), 404
        
        return jsonify({
            'role_level': group.get('group_level', 1),
            'role_name': group.get('group_name', 'Staff')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500