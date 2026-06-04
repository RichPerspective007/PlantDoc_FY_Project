from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["plantdoc"]

def get_db():
    return db