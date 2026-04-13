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
col = db["chat_collection"]


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

"""i assumed that username , sessionid will come as a string in my backend
    there may be more values that may come from frontend but i just assumed few of them will fix this when the frontend of auth.jsx is ready
"""

#for giving previous chats to llm model i made this function this will be req in messagePlaceHolder
def history_finder(user:str,session:str)->list:
  history=[]
  doc=col.find_one({
    "user_name":user,
    "session_id":session
  },{"messages":1})

  if doc and "messages" in doc:
    message_list=doc["messages"]
    for i in message_list:
      if i["role"]=="human":
        history.append(HumanMessage(i["text"]))
      else:
        history.append(AIMessage(i["text"]))
    return history
  else:
    return []
  
# if a message comes from user / ai that will go in my db for persistence
def save_messages(user:str,session:str,content:str,role:str):
  messages={
    "role":role,
    "text":content
  }
  
  col.update_one(
    {"user_name":user,"session_id":session},
    { "$set"  : {"session_id":session},
      "$push" : {
      "messages":{"$each":[messages]}
      }
    } , upsert=True
  )


#print(history_finder("sibasish","234"))
#save_messages("swapnil","123","how to remove stain from my bermuda ?","human")