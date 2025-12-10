from io import BytesIO
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import json

MODEL_PATH = "plant_disease.keras"
IMAGE_SIZE = 256
model = load_model(MODEL_PATH)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = tf.keras.models.load_model(MODEL_PATH)
class_names = []
with open("class_names.json") as f:
    class_names = json.load(f)

def preprocess_from_upload(file: UploadFile):
    # Read file bytes
    img_bytes = file.file.read()

    # Convert bytes → PIL image
    img = Image.open(BytesIO(img_bytes)).convert("RGB")

    # Resize (same as load_img(..., target_size=...))
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE))

    # Convert to array
    img_array = tf.keras.utils.img_to_array(img)

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array, img

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        img_array, original_img = preprocess_from_upload(file)

        # Model prediction
        pred = model.predict(img_array)

        index = np.argmax(pred)
        label = class_names[index]
        confidence = float(pred[0][index])

        return {
            "prediction": label,
            "confidence": confidence
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/")
async def root():
    return {"message": "Welcome to the Plant Disease Prediction API!"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000)