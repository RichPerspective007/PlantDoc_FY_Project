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
from auth import auth_bp, oauth

# ---------------- CONFIG ----------------

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model_genai = genai.GenerativeModel('gemini-3-flash-preview')

app = Flask(__name__)
app.secret_key = "super_secret_key"

CORS(app, supports_credentials=True)


oauth.init_app(app)


app.register_blueprint(auth_bp)

# ---------------- ML MODEL ----------------

MODEL_PATH = "plant_disease.keras"
IMAGE_SIZE = 256

model = load_model(MODEL_PATH)

with open("class_names.json") as f:
    class_names = json.load(f)

# ---------------- PREPROCESS ----------------

def preprocess_image(file):
    img_bytes = file.read()

    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE))

    img_array = tf.keras.utils.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    return img_array

# ---------------- PREDICT ----------------

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        img_array = preprocess_image(file)

        pred = model.predict(img_array)

        index = np.argmax(pred)
        label = class_names[index]
        confidence = float(pred[0][index])

        prompt = f"""
        Give response in JSON format:

        {{
        "description": "...",
        "steps": ["step1", "step2", "step3"]
        }}

        Disease: {label}
        """

        gemini_res = model_genai.generate_content(prompt)
        raw_text = gemini_res.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        try:
            parsed = json.loads(raw_text)
        except:
            parsed = {
                "description": "No description available",
                "steps": ["No steps available"]
            }

        return jsonify({
            "prediction": label,
            "confidence": confidence,
            "description": parsed["description"],
            "steps": parsed["steps"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- CHAT ----------------

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        m = data["message"]

        prompt = f"""
        Answer clearly for farmers in simple language.
        Keep it short and practical.

        Question: {m}
        """

        gemini_res = model_genai.generate_content(prompt)
        reply = gemini_res.text.strip()

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- HOME ----------------

@app.route("/")
def home():
    return jsonify({"message": "PlantDoc API Running"})

# ---------------- RUN ----------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)