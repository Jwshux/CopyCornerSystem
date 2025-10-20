from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

# Create Blueprint for schedules routes
schedules_bp = Blueprint('schedules', __name__)

# MongoDB connection
schedules_collection = None
users_collection = None
groups_collection = None

def init_schedules_db(mongo_schedules_collection, mongo_users_collection, mongo_groups_collection):
    """Initialize the schedules collection from app.py"""
    global schedules_collection, users_collection, groups_collection
    schedules_collection = mongo_schedules_collection
    users_collection = mongo_users_collection
    groups_collection = mongo_groups_collection

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
        # Convert staff_id to string if it exists
        if 'staff_id' in doc and doc['staff_id']:
            doc['staff_id'] = str(doc['staff_id'])
        # Handle date fields
        for field in ['created_at', 'updated_at', 'start_time', 'end_time']:
            if field in doc and doc[field]:
                if isinstance(doc[field], datetime):
                    doc[field] = doc[field].isoformat()
    return doc

# Get all schedules with staff names
@schedules_bp.route('/api/schedules', methods=['GET'])
def get_schedules():
    try:
        schedules_cursor = schedules_collection.find()
        schedules = []
        
        for schedule in schedules_cursor:
            # Look up staff name if staff_id exists
            if schedule.get('staff_id'):
                staff = users_collection.find_one({'_id': ObjectId(schedule['staff_id'])})
                schedule['staff_name'] = staff['name'] if staff else 'Unknown'
            else:
                schedule['staff_name'] = 'Unassigned'
            
            schedules.append(schedule)
        
        serialized_schedules = [serialize_doc(schedule) for schedule in schedules]
        return jsonify(serialized_schedules)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get single schedule by ID
@schedules_bp.route('/api/schedules/<schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    try:
        schedule = schedules_collection.find_one({'_id': ObjectId(schedule_id)})
        if schedule:
            # Look up staff name
            if schedule.get('staff_id'):
                staff = users_collection.find_one({'_id': ObjectId(schedule['staff_id'])})
                schedule['staff_name'] = staff['name'] if staff else 'Unknown'
            return jsonify(serialize_doc(schedule))
        return jsonify({'error': 'Schedule not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new schedule
@schedules_bp.route('/api/schedules', methods=['POST'])
def create_schedule():
    try:
        data = request.json
        
        # Get staff name before creating the schedule
        staff_name = "Unknown"
        if data.get('staff_id'):
            staff = users_collection.find_one({'_id': ObjectId(data['staff_id'])})
            staff_name = staff['name'] if staff else 'Unknown'
        
        new_schedule = {
            'day': data['day'],
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'staff_id': ObjectId(data['staff_id']) if data.get('staff_id') else None,
            'staff_name': staff_name,  # Store the staff name directly
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = schedules_collection.insert_one(new_schedule)
        new_schedule['_id'] = str(result.inserted_id)
        new_schedule['staff_id'] = str(new_schedule['staff_id']) if new_schedule['staff_id'] else None
        
        return jsonify(serialize_doc(new_schedule)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update schedule
@schedules_bp.route('/api/schedules/<schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    try:
        data = request.json
        
        # Get staff name before updating
        staff_name = "Unknown"
        if data.get('staff_id'):
            staff = users_collection.find_one({'_id': ObjectId(data['staff_id'])})
            staff_name = staff['name'] if staff else 'Unknown'
        
        update_data = {
            'day': data['day'],
            'start_time': data['start_time'],
            'end_time': data['end_time'],
            'staff_id': ObjectId(data['staff_id']) if data.get('staff_id') else None,
            'staff_name': staff_name,  # Update the staff name too
            'updated_at': datetime.utcnow()
        }
        
        result = schedules_collection.update_one(
            {'_id': ObjectId(schedule_id)},
            {'$set': update_data}
        )
        
        if result.matched_count:
            return jsonify({'message': 'Schedule updated successfully'})
        return jsonify({'error': 'Schedule not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete schedule
@schedules_bp.route('/api/schedules/<schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    try:
        # First, remove this schedule from any users who have it assigned
        users_collection.update_many(
            {'schedule_id': ObjectId(schedule_id)},
            {'$set': {'schedule_id': None}}
        )
        
        # Then delete the schedule
        result = schedules_collection.delete_one({'_id': ObjectId(schedule_id)})
        if result.deleted_count:
            return jsonify({'message': 'Schedule deleted successfully'})
        return jsonify({'error': 'Schedule not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get available staff (users with staff role)
@schedules_bp.route('/api/schedules/staff', methods=['GET'])
def get_available_staff():
    try:
        # First, let's debug what groups exist
        all_groups = list(groups_collection.find({}, {'group_name': 1}))
        print("🔍 All groups in database:", [group['group_name'] for group in all_groups])
        
        # Find the staff group - try different possible names
        staff_group = None
        possible_staff_names = ['Staff', 'staff', 'STAFF', 'Employee', 'employee', 'EMPLOYEE']
        
        for name in possible_staff_names:
            staff_group = groups_collection.find_one({'group_name': name})
            if staff_group:
                print(f"✅ Found staff group: {staff_group['group_name']}")
                break
        
        if not staff_group:
            # If still no staff group found, get the first group as fallback
            staff_group = groups_collection.find_one({})
            if staff_group:
                print(f"⚠️ No staff group found, using first group: {staff_group['group_name']}")
            else:
                print("❌ No groups found in database")
                return jsonify({'error': 'No groups found in database'}), 404
        
        # Find users who belong to the staff group and are active
        staff_users = users_collection.find({
            'group_id': staff_group['_id'],
            'status': 'Active'
        }, {'name': 1, 'username': 1})
        
        staff_list = []
        for user in staff_users:
            staff_list.append({
                '_id': str(user['_id']),
                'name': user.get('name', ''),
                'username': user.get('username', '')
            })
        
        print(f"📋 Found {len(staff_list)} staff users")
        return jsonify(staff_list)
        
    except Exception as e:
        print(f"❌ Error in get_available_staff: {str(e)}")
        return jsonify({'error': str(e)}), 500