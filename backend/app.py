from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os

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
    db = client["CopyCornerSystem"]  # your existing database
    users_collection = db["users"]
    client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print("❌ MongoDB connection error:", e)
    raise e

# -----------------------------
# Routes
# -----------------------------
@app.route("/")
def home():
    return jsonify({"message": "Backend running!"})

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()  # normalize
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = users_collection.find_one({"email": email})
    if user and user.get("password") == password:
        return jsonify({
            "message": "Login successful!",
            "user": {"email": user["email"]}
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# -----------------------------
# Run the app
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
