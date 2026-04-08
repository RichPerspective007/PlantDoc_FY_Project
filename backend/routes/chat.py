from flask import Blueprint, request, jsonify
from utils.model_genai_external import get_model_genai
model_genai = get_model_genai()

chat_bp = Blueprint("chat_bp", __name__)
#nlp portion updated giving response but response style should be more clean and effective need work here    
@chat_bp.route("/chat", methods=["POST"])
def gemini_api_chatbot_fun():
    try:
        data = request.json
        m = data["message"]

        prompt = f"""
        Answer clearly for farmers in simple language.
        Keep it short and practical.

        Question: {m}
        """

        gemini_res = model_genai.generate_content(prompt)
        reply = gemini_res.text.strip()

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500