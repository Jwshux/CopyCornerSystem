from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import bcrypt
import os

from groups_api import groups_bp, init_groups_db
from users_api import users_bp, init_users_db
from products_api import products_bp, init_products_db, init_products_relationships
from categories_api import categories_bp, init_categories_db
from schedule_api import schedules_bp, init_schedules_db
from staffs_api import staffs_bp, init_staffs_db
from transactions_api import transactions_bp, init_transactions_db, init_transactions_relationships
from services_api import service_types_bp, init_service_types_db, init_service_types_relationships
from sales_api import sales_bp, init_sales_db
from salesReport_api import sales_report_bp, init_sales_report_db
from inventoryReport_api import inventory_report_bp, init_inventory_report_db

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not set in .env")

app = Flask(__name__)
CORS(app)

# Password hashing helper functions
def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def check_password(plain_password, hashed_password):
    """Check if a plain password matches the hashed password"""
    if not hashed_password:
        return False
        
    try:
        # If hashed_password is bytes (from bcrypt)
        if isinstance(hashed_password, bytes):
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
        # If hashed_password is string (might be from migration)
        elif isinstance(hashed_password, str):
            # Try to decode as base64 first (if it was encoded for storage)
            import base64
            try:
                hashed_bytes = base64.b64decode(hashed_password)
                return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_bytes)
            except:
                # If it's not base64, try direct string comparison (for legacy)
                return hashed_password == plain_password
        else:
            return False
    except Exception as e:
        print(f"Password check error: {e}")
        return False

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["CopyCornerSystem"]
    
    # Initialize collections
    users_collection = db["users"]
    groups_collection = db["groups"]
    products_collection = db["products"]
    categories_collection = db["categories"]
    schedule_collection = db["schedule"]
    staffs_collection = db["staffs"]
    transactions_collection = db["transactions"]
    service_types_collection = db["service_type"]

    # Initialize databases
    init_groups_db(groups_collection, users_collection)
    init_users_db(users_collection, groups_collection, staffs_collection, schedule_collection)
    init_products_db(products_collection)
    init_categories_db(categories_collection, products_collection, service_types_collection)
    init_schedules_db(schedule_collection, users_collection, groups_collection)
    init_staffs_db(staffs_collection, users_collection, groups_collection, schedule_collection)
    init_transactions_db(transactions_collection, products_collection)
    init_service_types_db(service_types_collection, transactions_collection)
    init_sales_db(transactions_collection, service_types_collection)
    init_sales_report_db(transactions_collection, service_types_collection)
    init_inventory_report_db(products_collection, categories_collection)
    
    # Initialize relationships
    init_products_relationships(categories_collection, transactions_collection)
    init_service_types_relationships(categories_collection, products_collection)
    init_transactions_relationships(service_types_collection, categories_collection)
    
    client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print("❌ MongoDB connection error:", e)
    raise e

app.register_blueprint(groups_bp)
app.register_blueprint(users_bp)
app.register_blueprint(products_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(schedules_bp)
app.register_blueprint(staffs_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(service_types_bp)
app.register_blueprint(sales_bp)
app.register_blueprint(sales_report_bp)
app.register_blueprint(inventory_report_bp)

@app.route("/")
def home():
    return jsonify({"message": "Backend running!"})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    user = users_collection.find_one({"username": username})
    
    if user:
        # Check if account is archived
        if user.get("is_archived"):
            return jsonify({"error": "Your account has been archived. Please contact an administrator."}), 401
        
        # Check if account is inactive
        if user.get("status") != "Active":
            return jsonify({"error": "Your account is inactive. Please contact an administrator."}), 401
        
        # Check password using bcrypt
        user_password = user.get("password")
        if user_password and check_password(password, user_password):
            # Get user's group
            group = groups_collection.find_one({"_id": user["group_id"]})
            
            # Check if role is inactive
            if group and group.get("status") != "Active":
                return jsonify({"error": "Your user role has been deactivated. Please contact an administrator."}), 401
            
            # Update last login
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "last_login": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return jsonify({
                "message": "Login successful!",
                "user": {
                    "username": user["username"],
                    "name": user.get("name", ""),
                    "id": str(user["_id"]),
                    "role": group["group_name"] if group else "User",
                    "role_level": group.get("group_level", 1)
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    else:
        return jsonify({"error": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(debug=True)