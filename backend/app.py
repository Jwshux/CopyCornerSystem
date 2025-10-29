from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os

# Import the blueprints
from groups_api import groups_bp, init_groups_db
from users_api import users_bp, init_users_db
from products_api import products_bp, init_products_db
from categories_api import categories_bp, init_categories_db
from schedule_api import schedules_bp, init_schedules_db
from staffs_api import staffs_bp, init_staffs_db
from transactions_api import transactions_bp, init_transactions_db

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI not set in .env")

# -----------------------------
# Flask setup
# -----------------------------
app = Flask(__name__)
CORS(app)

# -----------------------------
# MongoDB setup
# -----------------------------
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["CopyCornerSystem"]
    users_collection = db["users"]
    groups_collection = db["groups"]
    products_collection = db["products"]
    categories_collection = db["categories"]
    schedule_collection = db["schedule"]
    staffs_collection = db["staffs"]
    transactions_collection = db["transactions"]

    # Initialize APIs with the collections
    init_groups_db(groups_collection)
    init_users_db(users_collection, groups_collection, staffs_collection)
    init_products_db(products_collection)
    init_categories_db(categories_collection, products_collection)
    init_schedules_db(schedule_collection, users_collection, groups_collection)
    init_staffs_db(staffs_collection, users_collection, groups_collection)
    init_transactions_db(transactions_collection, products_collection)
    
    client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print("❌ MongoDB connection error:", e)
    raise e

# -----------------------------
# Register Blueprints
# -----------------------------
app.register_blueprint(groups_bp)
app.register_blueprint(users_bp)
app.register_blueprint(products_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(schedules_bp)
app.register_blueprint(staffs_bp)
app.register_blueprint(transactions_bp)

# -----------------------------
# Routes
# -----------------------------
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
    
    # Check if user exists and password is correct
    if user and user.get("password") == password:
        # Check if USER is active
        if user.get("status") != "Active":
            return jsonify({"error": "Your account is inactive. Please contact administrator."}), 401
        
        # Check if USER'S GROUP is active
        group = groups_collection.find_one({"_id": user["group_id"]})
        if group and group.get("status") != "Active":
            return jsonify({"error": "Your user role has been deactivated. Please contact administrator."}), 401
        
        # Update last login (only if both user and group are active)
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
                "id": str(user["_id"])
            }
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# -----------------------------
# Run the app
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)