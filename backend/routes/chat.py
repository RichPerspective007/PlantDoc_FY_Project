# from flask import request, jsonify, Blueprint
# import os
# from dotenv import load_dotenv
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_core.messages import HumanMessage, AIMessage
# from langchain_google_genai import ChatGoogleGenerativeAI

# from utils.load_mongo_client import get_db


# load_dotenv()

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# db = get_db()
# col = db["chatbot"]


# chat_bp = Blueprint("chat", __name__)


# model = ChatGoogleGenerativeAI(
#     model="gemini-3-flash-preview",
#     google_api_key=GEMINI_API_KEY
# )

# chat_template = ChatPromptTemplate(
#     [
#         ("system", "You are an expert agriculture assistant and give me reply related to agriculture only nothing else only in just 2 lines not more that and always reply in {language} ."),

#         MessagesPlaceholder(variable_name="history"),

#         ("human", "{input}")
#     ]
# )

# chain = chat_template | model

# def history_finder(phone_number, session):
#     history = []
#     doc = col.find_one(
#         {"phone_number": phone_number, "session_id": session},
#         {"messages": 1}
#     )

#     if doc and "messages" in doc:
#         message_list = doc["messages"]
#         for i in message_list:
#             if i["role"] == "human":
#                 history.append(HumanMessage(i["text"]))
#             else:
#                 history.append(AIMessage(i["text"]))
#         return history
#     else:
#         return []

# def save_messages(phone_number, session, content, role):
#     message = {
#         "role": role,
#         "text": content
#     }

#     col.update_one(
#         {"phone_number": phone_number, "session_id": session},
#         {
#             "$set": {"session_id": session},
#             "$push": {"messages": {"$each": [message]}}
#         },
#         upsert=True
#     )


# @chat_bp.route("/chat", methods=['POST'])
# def chat():
#     data = request.get_json()

#     phone_number = data.get("phone_number")
#     session = data.get("session_id")
#     user_input = data.get("message")
#     selected_language = data.get("language")

#     if not all([phone_number, session, user_input]):
#         return jsonify({"errorMessage": "Missing fields"}), 400

#     history = history_finder(phone_number, session)

#     response_from_ai = chain.invoke(
#         {
#             "history": history,
#             "input": user_input,
#             "language": selected_language or "English"
#         }
#     )

#     ai_reply_actual = response_from_ai.content[0]["text"]

#     save_messages(phone_number, session, user_input, "human")
#     save_messages(phone_number, session, ai_reply_actual, "ai")

#     return jsonify({
#         "reply": ai_reply_actual,
#         "session_id": session,
#         "phone_number": phone_number
#     }), 201


# @chat_bp.route("/showconvolist", methods=["GET"])
# def get_list_of_convo():
#     phone_number = request.args.get("phone_number")

#     sessions_got = col.find(
#         {"phone_number": phone_number},
#         {"session_id": 1}
#     )

#     return jsonify([i["session_id"] for i in sessions_got])


# @chat_bp.route("/internalconvo", methods=["GET"])
# def internal_convo_get():
#     phone_number = request.args.get("phone_number")
#     session = request.args.get("session_id")

#     internal_con = col.find_one(
#         {"phone_number": phone_number, "session_id": session},
#         {"messages": 1}
#     )

#     return jsonify(internal_con.get("messages", []) if internal_con else [])






from flask import request, jsonify, Blueprint
import os
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from utils.load_mongo_client import get_db


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
db = get_db()
col = db["chatbot"]


chat_bp = Blueprint("chat", __name__)


model = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    google_api_key=GEMINI_API_KEY
)

chat_template = ChatPromptTemplate(
    [
        ("system", "You are an expert agriculture assistant and give me reply related to agriculture only nothing else only in just 2 lines not more that and always reply in {language} ."),

        MessagesPlaceholder(variable_name="history"),

        ("human", "{input}")
    ]
)

chain = chat_template | model

def history_finder(phone_number, session):
    history = []
    doc = col.find_one(
        {"phone_number": phone_number, "session_id": session},
        {"messages": 1}
    )

    if doc and "messages" in doc:
        message_list = doc["messages"]
        for i in message_list:
            if i["role"] == "human":
                history.append(HumanMessage(i["text"]))
            else:
                history.append(AIMessage(i["text"]))
        return history
    else:
        return []

def save_messages(phone_number, session, content, role):
    message = {
        "role": role,
        "text": content
    }

    col.update_one(
        {"phone_number": phone_number, "session_id": session},
        {
            "$set": {"session_id": session},
            "$push": {"messages": {"$each": [message]}}
        },
        upsert=True
    )


@chat_bp.route("/chat", methods=['POST'])
def chat():
    data = request.get_json()

    phone_number = data.get("phone_number")
    session = data.get("session_id")
    user_input = data.get("message")
    selected_language = data.get("language")

    if not all([phone_number, session, user_input]):
        return jsonify({"errorMessage": "Missing fields"}), 400

    history = history_finder(phone_number, session)

    response_from_ai = chain.invoke(
        {
            "history": history,
            "input": user_input,
            "language": selected_language or "English"
        }
    )

    ai_reply_actual = response_from_ai.content[0]["text"]

    save_messages(phone_number, session, user_input, "human")
    save_messages(phone_number, session, ai_reply_actual, "ai")

    return jsonify({
        "reply": ai_reply_actual,
        "session_id": session,
        "phone_number": phone_number
    }), 201


@chat_bp.route("/showconvolist", methods=["GET"])
def get_list_of_convo():
    phone_number = request.args.get("phone_number")

    sessions_got = col.find(
        {"phone_number": phone_number},
        {"session_id": 1}
    )

    return jsonify([i["session_id"] for i in sessions_got])


@chat_bp.route("/internalconvo", methods=["GET"])
def internal_convo_get():
    phone_number = request.args.get("phone_number")
    session = request.args.get("session_id")

    internal_con = col.find_one(
        {"phone_number": phone_number, "session_id": session},
        {"messages": 1}
    )

    return jsonify(internal_con.get("messages", []) if internal_con else [])