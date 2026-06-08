from functools import wraps
from flask import request, jsonify, g
import jwt
import os
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")  # Default to HS256 if not set

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('access_token')
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            g.current_user = data # Store user info in Flask's global context
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401

        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    
    return decorated