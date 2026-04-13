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
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")


client = MongoClient(MONGO_URI)
db = client["plantdoc"]
col = db["chatbot"]


chat_bp = Blueprint("chat", __name__)


model = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=GEMINI_API_KEY
)

chat_template = ChatPromptTemplate(
    [
        ("system", "You are an expert agriculture assistant and give me reply related to agriculture only nothing else only in just 2 - 5 lines not more that"),

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


#one route created for contextual bot reply
@chat_bp.route("/chat",methods=['POST'])
def chat():
  data=request.get_json()

  user=data.get("user_name")
  session=data.get("session_id")
  user_input=data.get("message")

  if not all([user,session,user_input]):
    return jsonify({"errorMessage":"Missing fields"}) , 400
  
  history=history_finder(user,session)

  reponse_from_ai=chain.invoke(
    {
      "history":history,
      "input":user_input
    }
  )

  ai_reply_actual=reponse_from_ai.content[0]["text"]

  save_messages(user,session,user_input,"human")
  save_messages(user,session,ai_reply_actual,"ai")

  return jsonify( {
      "reply":ai_reply_actual,
      "session_id":session,
      "user":user
    } , 201
  )


@chat_bp.route("/showconvolist", methods=["GET"])
def get_list_ofconvo():
  user=request.args.get("user_name")
  
  sessions_got=col.find(
    {"user_name":user},
    {"session_id":1}
  )

  return jsonify([i["session_id"] for i in sessions_got])

@chat_bp.route("/internalconvo",methods=["GET"])
def internal_convo_get():
  user=request.args.get("user_name")
  session=request.args.get("session_id")

  internal_con=col.find_one(
    {"user_name":user,"session_id":session},
    {"messages":1}
  )

  return jsonify(internal_con.get("messages", []) if internal_con else [])