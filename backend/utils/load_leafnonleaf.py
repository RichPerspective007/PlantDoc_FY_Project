import keras
from huggingface_hub import hf_hub_download

def get_leaf_nonleaf_model():
    # This pulls the 200MB file from HF only if it's not already in the cache
    model_path = hf_hub_download(repo_id="Plant-Disease-Detection-Team/leaf_disease_models", filename="latest_lnl.keras")
    
    # Load it into your backend
    model = keras.saving.load_model(model_path)
    return model    

def get_prediction_model():
    model_path = hf_hub_download(repo_id="Plant-Disease-Detection-Team/leaf_disease_models", filename="plantdoc_disease_model.keras")
    model = keras.saving.load_model(model_path)
    return model