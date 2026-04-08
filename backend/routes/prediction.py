from flask import Blueprint, request, jsonify
from PIL import Image
import os
from tensorflow.keras.models import load_model
import json
from utils.img_preprocess import preprocess_image
from utils.model_genai_external import get_model_genai
import numpy as np
model_genai = get_model_genai()

prediction_bp = Blueprint("prediction_bp", __name__)

MODEL_PATH = os.path.join(os.path.dirname(prediction_bp.root_path), "model", "plant_disease.keras")
IMAGE_SIZE = 256

# Load model 
model = load_model(MODEL_PATH)

# Load class names
with open(os.path.join(os.path.dirname(prediction_bp.root_path), "data", "class_names.json")) as f:
    class_names = json.load(f)

@prediction_bp.route("/predict", methods=["POST"])
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