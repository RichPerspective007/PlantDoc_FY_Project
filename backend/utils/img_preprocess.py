from PIL import Image
import numpy as np
from io import BytesIO
import tensorflow as tf

# Preprocess function
def preprocess_image(file):
    print(f"Preprocessing image: {file.filename}")
    img_bytes = file.read()
    print(f"Image bytes read: {len(img_bytes)}")
    try:
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        print(f"Error opening image: {e}")
        raise
    print(f"Image opened: {img.size}, mode: {img.mode}")
    try:
        img1 = img.resize((224, 224))
    except Exception as e:
        print(f"Error resizing image: {e}")
        raise

    img_array1 = tf.keras.utils.img_to_array(img1)
    img_array1 = np.expand_dims(img_array1, axis=0)

    return img_array1