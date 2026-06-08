from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json
from io import BytesIO
import google.generativeai as genai  
import os
from routes.chat import *
from routes.prediction import *
from routes.verification import start_verification_bp, check_verification_bp, profile_bp
from routes.localized_threats import localized_threats_bp
from utils.cacheinstance import cache

app = Flask(__name__)
app.secret_key = "super_secret_key"
cache.init_app(app)

app.register_blueprint(chat_bp)
app.register_blueprint(prediction_bp)
app.register_blueprint(start_verification_bp)
app.register_blueprint(check_verification_bp)
app.register_blueprint(localized_threats_bp)
app.register_blueprint(profile_bp)

@app.after_request
def force_cors_credentials(response):
    # Get the URL of whoever is making the request
    origin = request.headers.get('Origin')
    print(origin)
    # Whitelist your React frontend
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    if origin in allowed_origins:
        # Manually staple the exact headers the browser is screaming for
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        
    return response

# ---------------- HOME ----------------

@app.route("/")
def home():
    return jsonify({"message": "PlantDoc API Running"})

# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)