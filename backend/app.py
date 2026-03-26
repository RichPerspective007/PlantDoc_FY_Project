from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json
from io import BytesIO

app = Flask(__name__)
CORS(app)

MODEL_PATH = "plant_disease.keras"
IMAGE_SIZE = 256

# Load model 
model = load_model(MODEL_PATH)

# Load class names
with open("class_names.json") as f:
    class_names = json.load(f)


# Preprocess function
def preprocess_image(file):
    img_bytes = file.read()

    img = Image.open(BytesIO(img_bytes)).convert("RGB")
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE))

    img_array = tf.keras.utils.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


# Prediction 
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

        return jsonify({
            "prediction": label,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Home route
@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Plant Disease Prediction API!"})


# Run Flask
if __name__ == "__main__":
    app.run(debug=True, port=5000)