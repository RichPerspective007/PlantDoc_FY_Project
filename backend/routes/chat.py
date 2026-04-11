# from flask import Blueprint, request, jsonify
# from utils.model_genai_external import get_model_genai
# model_genai = get_model_genai()

# chat_bp = Blueprint("chat_bp", __name__)
# #nlp portion updated giving response but response style should be more clean and effective need work here    
# @chat_bp.route("/chat", methods=["POST"])
# def gemini_api_chatbot_fun():
#     try:
#         data = request.json
#         m = data["message"]

#         prompt = f"""
#         Answer clearly for farmers in simple language.
#         Keep it short and practical.

#         Question: {m}
#         """

#         gemini_res = model_genai.generate_content(prompt)
#         reply = gemini_res.text.strip()

#         return jsonify({"reply": reply})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

from flask import Flask, request, jsonify, Blueprint
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import uuid

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")


client = MongoClient(MONGO_URI)
db = client["plantdoc_demo"]
collection_chat = db["chat_collection"]


chat_bp = Blueprint("chat", __name__)


model = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=GEMINI_API_KEY
)

chat_template = ChatPromptTemplate(
    [
        ("system", "You are an expert agriculture assistant."),

        MessagesPlaceholder(variable_name="history"),

        ("human", "{input}")
    ]
)

chain = chat_template | model

