from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os

# Create Blueprint for sales routes
sales_bp = Blueprint('sales', __name__)

# MongoDB connection (will be initialized from app.py)
transactions_collection = None
service_types_collection = None

def init_sales_db(transactions_coll, service_types_coll):
    """Initialize the collections from app.py"""
    global transactions_collection, service_types_collection
    transactions_collection = transactions_coll
    service_types_collection = service_types_coll

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Get sales analytics data
@sales_bp.route('/sales/analytics', methods=['GET'])
def get_sales_analytics():
    try:
        # FIXED: Use exact case matching like in local version
        completed_transactions = list(transactions_collection.find({
            'status': 'Completed'
        }))
        
        # Use server's local time (make sure your server is set to Philippine time)
        today = datetime.now().date()
        today_str = today.strftime('%Y-%m-%d')
        
        # Calculate weekly range (last 7 days including today)
        weekly_start = (today - timedelta(days=6))
        weekly_start_str = weekly_start.strftime('%Y-%m-%d')
        
        print(f"=== SALES ANALYTICS DEBUG ===")
        print(f"Server Date - Today: {today_str} ({today.strftime('%A')})")
        print(f"Weekly Start: {weekly_start_str} ({weekly_start.strftime('%A')})")
        print(f"Total completed transactions: {len(completed_transactions)}")
        
        # Filter transactions for different time periods
        today_transactions = []
        weekly_transactions = []
        
        for transaction in completed_transactions:
            transaction_date = transaction.get('date')
            if not transaction_date:
                continue
                
            # Convert transaction date to datetime object for comparison
            try:
                trans_date = datetime.strptime(transaction_date, '%Y-%m-%d').date()
            except:
                continue
            
            if transaction_date == today_str:
                today_transactions.append(transaction)
            
            if weekly_start <= trans_date <= today:
                weekly_transactions.append(transaction)
        
        print(f"Today transactions: {len(today_transactions)}")
        print(f"Weekly transactions: {len(weekly_transactions)}")
        
        # Calculate summary metrics
        today_sales = sum(float(t.get('total_amount', 0)) for t in today_transactions)
        weekly_sales = sum(float(t.get('total_amount', 0)) for t in weekly_transactions)
        
        # Calculate daily totals for the last 7 days for chart
        daily_totals = {}
        day_names = {}
        for i in range(7):
            date = (today - timedelta(days=i))
            date_str = date.strftime('%Y-%m-%d')
            day_name = date.strftime('%a')  # Short day name (Mon, Tue, etc.)
            daily_totals[date_str] = 0
            day_names[date_str] = day_name
            print(f"Day {i}: {date_str} ({day_name})")
        
        # Fill in actual sales data
        for transaction in weekly_transactions:
            date = transaction.get('date')
            if date in daily_totals:
                daily_totals[date] += float(transaction.get('total_amount', 0))
        
        # Calculate how many days have passed in the current week (Mon=0 to Sun=6)
        # For daily average, we only count days that have actually occurred
        current_weekday = today.weekday()  # Monday=0, Sunday=6
        days_passed_in_week = current_weekday + 1  # +1 because we include today
        
        # But for the chart, we want exactly 7 days
        daily_average = weekly_sales / 7  # Always divide by 7 for weekly average
        
        print(f"Today sales: {today_sales}")
        print(f"Weekly sales: {weekly_sales}")
        print(f"Current weekday: {current_weekday} ({today.strftime('%A')})")
        print(f"Days passed in week: {days_passed_in_week}")
        print(f"Daily average: {daily_average}")
        
        # Find top service by number of transactions
        service_counts = {}
        for transaction in completed_transactions:
            service_type = transaction.get('service_type')
            if service_type:
                service_counts[service_type] = service_counts.get(service_type, 0) + 1
        
        top_service = max(service_counts.items(), key=lambda x: x[1])[0] if service_counts else "No data"
        print(f"Top service: {top_service}")
        
        # Get daily sales for the last 7 days for chart - in correct chronological order
        daily_sales_data = []
        labels = []
        
        # Start from oldest to newest (Monday to Sunday)
        for i in range(6, -1, -1):
            date = (today - timedelta(days=i))
            date_str = date.strftime('%Y-%m-%d')
            day_name = day_names.get(date_str, date.strftime('%a'))
            labels.append(day_name)
            daily_sales_data.append(daily_totals.get(date_str, 0))
            print(f"Chart position {i}: {day_name} ({date_str}) = {daily_totals.get(date_str, 0)}")
        
        print(f"Final chart labels: {labels}")
        print(f"Final chart data: {daily_sales_data}")
        
        # Get service revenue summary
        service_revenue = {}
        service_transaction_counts = {}
        
        for transaction in completed_transactions:
            service_type = transaction.get('service_type')
            total_amount = float(transaction.get('total_amount', 0))
            
            if service_type:
                if service_type not in service_revenue:
                    service_revenue[service_type] = 0
                    service_transaction_counts[service_type] = 0
                
                service_revenue[service_type] += total_amount
                service_transaction_counts[service_type] += 1
        
        # Convert to list for frontend
        service_summary = []
        for service_type, revenue in service_revenue.items():
            service_summary.append({
                'service': service_type,
                'transactions': service_transaction_counts[service_type],
                'total_sales': revenue
            })
        
        # Sort by revenue descending
        service_summary.sort(key=lambda x: x['total_sales'], reverse=True)
        
        print(f"Service summary: {service_summary}")
        print(f"=== END DEBUG ===")
        
        return jsonify({
            'summary': {
                'today_sales': today_sales,
                'weekly_sales': weekly_sales,
                'daily_average': daily_average,
                'top_service': top_service
            },
            'daily_sales': {
                'labels': labels,
                'data': daily_sales_data
            },
            'service_summary': service_summary
        })
        
    except Exception as e:
        print(f"Error in sales analytics: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get sales by SERVICE TYPE for pie chart
@sales_bp.route('/sales/by-service-type', methods=['GET'])
def get_sales_by_service_type():
    try:
        # FIXED: Use exact case matching like in local version
        completed_transactions = list(transactions_collection.find({
            'status': 'Completed'
        }))
        
        # Calculate sales by SERVICE TYPE
        service_type_sales = {}
        for transaction in completed_transactions:
            service_type = transaction.get('service_type')
            total_amount = float(transaction.get('total_amount', 0))
            
            if service_type:
                if service_type not in service_type_sales:
                    service_type_sales[service_type] = 0
                service_type_sales[service_type] += total_amount
        
        # Convert to format for pie chart
        labels = list(service_type_sales.keys())
        data = list(service_type_sales.values())
        
        return jsonify({
            'labels': labels,
            'data': data
        })
        
    except Exception as e:
        print(f"Error in sales by service type: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Debug endpoint to check transaction statuses
@sales_bp.route('/sales/debug-transactions', methods=['GET'])
def debug_transactions():
    """Debug endpoint to check transaction statuses"""
    try:
        # Get all transactions with their statuses
        all_transactions = list(transactions_collection.find({}, {'status': 1, 'total_amount': 1, 'date': 1, 'service_type': 1, 'customer_name': 1}))
        
        status_counts = {}
        for t in all_transactions:
            status = t.get('status', 'No Status')
            status_counts[status] = status_counts.get(status, 0) + 1
        
        completed_transactions = [t for t in all_transactions if str(t.get('status', '')).lower() == 'completed']
        
        return jsonify({
            'status_counts': status_counts,
            'total_transactions': len(all_transactions),
            'completed_transactions_count': len(completed_transactions),
            'completed_transactions_sample': [serialize_doc(t) for t in completed_transactions[:5]]  # First 5 for sample
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# NEW: Debug endpoint to check status values
@sales_bp.route('/sales/debug-status', methods=['GET'])
def debug_status():
    """Check what status values exist in transactions"""
    try:
        # Get all unique status values
        pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_counts = list(transactions_collection.aggregate(pipeline))
        
        return jsonify({
            'status_counts': status_counts,
            'total_transactions': transactions_collection.count_documents({})
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500