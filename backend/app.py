from flask import Flask, request, jsonify
from flask_cors import CORS  # allow requests from React frontend

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Dummy users for testing
users = {
    "test@example.com": "password123",
    "alice@example.com": "mypassword"
}

@app.route('/')
def home():
    return jsonify({"message": "Flask backend is running!"})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if email in users and users[email] == password:
        return jsonify({"message": "Login successful!"})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

if __name__ == '__main__':
    app.run(debug=True)
