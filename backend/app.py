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
#from auth import auth_bp, oauth

app = Flask(__name__)
app.secret_key = "super_secret_key"

CORS(app, supports_credentials=True)

#oauth.init_app(app)


#app.register_blueprint(auth_bp)

app.register_blueprint(chat_bp)
app.register_blueprint(prediction_bp)
CORS(app) 

# ---------------- HOME ----------------

@app.route("/")
def home():
    return jsonify({"message": "PlantDoc API Running"})

# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)