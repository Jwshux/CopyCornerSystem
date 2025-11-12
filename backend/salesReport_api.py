from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import os

# Create Blueprint for sales reports
sales_report_bp = Blueprint('sales_report', __name__)

# MongoDB collections (will be initialized from app.py)
transactions_collection = None
service_types_collection = None

def init_sales_report_db(transactions_coll, service_types_coll):
    """Initialize the collections from app.py"""
    global transactions_collection, service_types_collection
    transactions_collection = transactions_coll
    service_types_collection = service_types_coll

# Helper to convert ObjectId to string
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Sales Report Endpoint
@sales_report_bp.route('/reports/sales', methods=['GET'])
def get_sales_report():
    try:
        # Get date range from query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        if not start_date_str or not end_date_str:
            return jsonify({'error': 'Start date and end date are required'}), 400
        
        # Parse dates
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Adjust end date to include the entire day
        end_date = end_date.replace(hour=23, minute=59, second=59)
        
        print(f"=== SALES REPORT DEBUG ===")
        print(f"Date Range: {start_date_str} to {end_date_str}")
        
        # Query transactions within date range and completed status
        query = {
            'status': 'Completed',
            'date': {
                '$gte': start_date_str,
                '$lte': end_date_str
            }
        }
        
        transactions = list(transactions_collection.find(query))
        print(f"Found {len(transactions)} completed transactions in date range")
        
        # Calculate total revenue and transaction count
        total_revenue = 0
        transaction_count = len(transactions)
        
        # Calculate service type breakdown
        service_type_breakdown = {}
        
        for transaction in transactions:
            # Add to total revenue
            total_amount = float(transaction.get('total_amount', 0))
            total_revenue += total_amount
            
            # Track by service type
            service_type = transaction.get('service_type', 'Unknown')
            if service_type not in service_type_breakdown:
                service_type_breakdown[service_type] = {
                    'service_name': service_type,
                    'transaction_count': 0,
                    'revenue': 0
                }
            
            service_type_breakdown[service_type]['transaction_count'] += 1
            service_type_breakdown[service_type]['revenue'] += total_amount
        
        # Convert to list and sort by revenue descending
        service_breakdown_list = list(service_type_breakdown.values())
        service_breakdown_list.sort(key=lambda x: x['revenue'], reverse=True)
        
        # Calculate daily sales for the period
        daily_sales = {}
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            daily_sales[date_str] = 0
            current_date += timedelta(days=1)
        
        # Fill in actual daily sales
        for transaction in transactions:
            date_str = transaction.get('date')
            if date_str in daily_sales:
                daily_sales[date_str] += float(transaction.get('total_amount', 0))
        
        # Convert daily sales to list format for frontend
        daily_sales_list = [
            {
                'date': date_str,
                'sales': amount,
                'day_name': datetime.strptime(date_str, '%Y-%m-%d').strftime('%a')
            }
            for date_str, amount in daily_sales.items()
        ]
        daily_sales_list.sort(key=lambda x: x['date'])
        
        print(f"Total Revenue: {total_revenue}")
        print(f"Transaction Count: {transaction_count}")
        print(f"Service Types: {len(service_breakdown_list)}")
        print(f"Daily Sales Days: {len(daily_sales_list)}")
        print(f"=== END SALES REPORT DEBUG ===")
        
        # Return the report data
        return jsonify({
            'totalRevenue': total_revenue,
            'transactionCount': transaction_count,
            'serviceTypeBreakdown': service_breakdown_list,
            'dailySales': daily_sales_list,
            'dateRange': {
                'startDate': start_date_str,
                'endDate': end_date_str
            }
        })
        
    except Exception as e:
        print(f"Error generating sales report: {str(e)}")
        return jsonify({'error': str(e)}), 500