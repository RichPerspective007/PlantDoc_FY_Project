from flask import Blueprint, request, jsonify
from PIL import Image
from datetime import datetime, UTC
import os
from tensorflow.keras.models import load_model
import json
from utils.img_preprocess import preprocess_image
from utils.model_genai_external import get_model_genai
from utils.load_leafnonleaf import get_leaf_nonleaf_model, get_prediction_model
from utils.load_mongo_client import get_db
import numpy as np
model_genai = get_model_genai()

prediction_bp = Blueprint("prediction_bp", __name__)
db = get_db()
scans = db["scans"]

#LEAF_VS_NONLEAF_MODEL_PATH = os.path.join(os.path.dirname(prediction_bp.root_path), "model", "best_leaf_model.keras")
#leaf_nonleaf_model = load_model(LEAF_VS_NONLEAF_MODEL_PATH)
leaf_nonleaf_model = get_leaf_nonleaf_model()
#MODEL_PATH = os.path.join(os.path.dirname(prediction_bp.root_path), "model", "plant_disease.keras")
IMAGE_SIZE = 256

# Load model 
#model = load_model(MODEL_PATH)
model = get_prediction_model()  # Load the plant disease model

# Load class names
with open(os.path.join(os.path.dirname(prediction_bp.root_path), "data", "class_names.json")) as f:
    class_names = json.load(f)

@prediction_bp.route("/predict", methods=["POST"])
def predict():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        coords = True
        if (request.form.get("latitude") is None) or (request.form.get("longitude") is None):
            coords = False
        lat = float(request.form.get("latitude"))
        lon = float(request.form.get("longitude"))
        img_lnl_array, img_array = preprocess_image(file)  # Use smaller size for leaf vs non-leaf model
        lnl_pred = leaf_nonleaf_model.predict(img_lnl_array)
        if lnl_pred[0][0] > 0.5:
            return jsonify({
                "prediction": "Not a leaf",
                "confidence": float(1 - lnl_pred[0][0]),
                "description": "The uploaded image does not appear to be a leaf.",
                "steps": []
            })

        pred = model.predict(img_array)

        index = np.argmax(pred)
        label = class_names[index]
        confidence = float(pred[0][index])
        try:
            scan_document = {
                "disease_name": label,
                "location": {
                    "type": "Point",
                    "coordinates": [lon, lat]  # Longitude first!
                },
                "timestamp": datetime.now(UTC)
            }
            scans.insert_one(scan_document)
        except Exception as e:
            print(f"Error saving scan to database: {e}")
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