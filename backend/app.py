from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Import the groups blueprint
from groups_api import groups_bp, init_groups_db

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
    groups_collection = db["groups"]  # Add groups collection
    
    # Initialize groups API with the collection
    init_groups_db(groups_collection)
    
    client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print("❌ MongoDB connection error:", e)
    raise e

# -----------------------------
# Register Blueprints
# -----------------------------
app.register_blueprint(groups_bp)

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
    if user and user.get("password") == password:
        return jsonify({
            "message": "Login successful!",
            "user": {"username": user["username"]}
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# -----------------------------
# Run the app
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)