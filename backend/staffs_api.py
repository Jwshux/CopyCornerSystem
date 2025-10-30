from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for staffs routes
staffs_bp = Blueprint('staffs', __name__)

# MongoDB connection (will be initialized from app.py)
staffs_collection = None
users_collection = None
groups_collection = None
schedules_collection = None  # ADD THIS

def init_staffs_db(mongo_staffs_collection, mongo_users_collection, mongo_groups_collection, mongo_schedules_collection):  # UPDATE THIS
    """Initialize the collections from app.py"""
    global staffs_collection, users_collection, groups_collection, schedules_collection  # UPDATE THIS
    staffs_collection = mongo_staffs_collection
    users_collection = mongo_users_collection
    groups_collection = mongo_groups_collection
    schedules_collection = mongo_schedules_collection  # ADD THIS

# Helper to convert ObjectId to string and format dates
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        if 'user_id' in doc and doc['user_id']:
            doc['user_id'] = str(doc['user_id'])
        
        # Handle date formatting
        for field in ['created_at', 'updated_at', 'last_login']:
            if field in doc and doc[field]:
                if isinstance(doc[field], dict) and '$date' in doc[field]:
                    doc[field] = doc[field]['$date']
                elif isinstance(doc[field], datetime):
                    doc[field] = doc[field].isoformat() + 'Z'
                    
    return doc

# Get all staffs with user details
@staffs_bp.route('/api/staffs', methods=['GET'])
def get_staffs():
    try:
        # Get pagination parameters from query string
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate skip value
        skip = (page - 1) * per_page
        
        # First, get all users with staff role
        staff_users = list(users_collection.find({
            'group_id': {
                '$in': [ObjectId(group['_id']) for group in groups_collection.find({
                    'group_name': {'$regex': 'staff', '$options': 'i'}
                })]
            }
        }).skip(skip).limit(per_page))
        
        # Get total count for pagination info
        total_staffs = users_collection.count_documents({
            'group_id': {
                '$in': [ObjectId(group['_id']) for group in groups_collection.find({
                    'group_name': {'$regex': 'staff', '$options': 'i'}
                })]
            }
        })
        
        # Calculate total pages
        total_pages = (total_staffs + per_page - 1) // per_page  # Ceiling division
        
        # Get staff details for each staff user
        staffs = []
        for user in staff_users:
            # Get staff details from staffs collection
            staff = staffs_collection.find_one({'user_id': user['_id']})
            
            # Get group name
            group = groups_collection.find_one({'_id': ObjectId(user['group_id'])})
            role = group['group_name'] if group else 'Unknown'
            
            staff_data = {
                '_id': str(user['_id']),  # Use user ID as the main ID
                'user_id': str(user['_id']),
                'name': user.get('name', ''),
                'username': user.get('username', ''),
                'role': role,
                'status': user.get('status', 'Active'),
                'studentNumber': staff.get('studentNumber', '') if staff else '',
                'course': staff.get('course', '') if staff else '',
                'section': staff.get('section', '') if staff else '',
                'last_login': user.get('last_login'),
                'created_at': user.get('created_at'),
                'updated_at': user.get('updated_at')
            }
            staffs.append(staff_data)
        
        # Return pagination info along with staffs
        return jsonify({
            'staffs': [serialize_doc(staff) for staff in staffs],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_staffs': total_staffs,
                'total_pages': total_pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single staff by user ID
@staffs_bp.route('/api/staffs/user/<user_id>', methods=['GET'])
def get_staff_by_user_id(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has staff role
        group = groups_collection.find_one({'_id': ObjectId(user['group_id'])})
        if not group or 'staff' not in group['group_name'].lower():
            return jsonify({'error': 'User is not a staff member'}), 400
        
        # Get staff details
        staff = staffs_collection.find_one({'user_id': ObjectId(user_id)})
        
        staff_data = {
            '_id': str(user['_id']),
            'user_id': str(user['_id']),
            'name': user.get('name', ''),
            'username': user.get('username', ''),
            'role': group['group_name'],
            'status': user.get('status', 'Active'),
            'studentNumber': staff.get('studentNumber', '') if staff else '',
            'course': staff.get('course', '') if staff else '',
            'section': staff.get('section', '') if staff else '',
            'last_login': user.get('last_login'),
            'created_at': user.get('created_at'),
            'updated_at': user.get('updated_at')
        }
        
        return jsonify(serialize_doc(staff_data))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update staff details
@staffs_bp.route('/api/staffs/user/<user_id>', methods=['PUT'])
def update_staff(user_id):
    try:
        data = request.json
        
        # Check if user exists and is staff
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        group = groups_collection.find_one({'_id': ObjectId(user['group_id'])})
        if not group or 'staff' not in group['group_name'].lower():
            return jsonify({'error': 'User is not a staff member'}), 400
        
        # CHECK: If changing status to Inactive, verify no active schedules
        if data.get('status') == 'Inactive' and user.get('status') == 'Active':
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
        
        # Check if username already exists (excluding current user)
        existing_user = users_collection.find_one({
            'username': data['username'],
            '_id': {'$ne': ObjectId(user_id)}
        })
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        
        # Update user details
        user_update_data = {
            'name': data['name'],
            'username': data['username'],
            'status': data['status'],
            'updated_at': datetime.utcnow()
        }
        
        # Update password if provided
        if data.get('password'):
            user_update_data['password'] = data['password']
        
        # Update user
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': user_update_data}
        )
        
        # Update or create staff details
        staff_update_data = {
            'studentNumber': data['studentNumber'],
            'course': data['course'],
            'section': data['section'],
            'updated_at': datetime.utcnow()
        }
        
        staffs_collection.update_one(
            {'user_id': ObjectId(user_id)},
            {'$set': staff_update_data},
            upsert=True  # Create if doesn't exist
        )
        
        return jsonify({'message': 'Staff updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete staff (DELETE FROM STAFFS COLLECTION)
@staffs_bp.route('/api/staffs/user/<user_id>', methods=['DELETE'])
def delete_staff(user_id):
    try:
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
        
        # Delete from staffs collection
        staff_result = staffs_collection.delete_one({'user_id': ObjectId(user_id)})
        
        # Also delete from users collection
        user_result = users_collection.delete_one({'_id': ObjectId(user_id)})
        
        if user_result.deleted_count:
            return jsonify({'message': 'Staff deleted successfully'})
        return jsonify({'error': 'Staff not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500