from flask import request, jsonify, Blueprint
import os
import jwt
import datetime
from dotenv import load_dotenv
from twilio.rest import Client
from pymongo import MongoClient

load_dotenv()

#print(os.getenv("MONGO_URI"))
mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["plantdoc"]
users_collection = db["users"]

#secret = os.getenv("JWT_SECRET")

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

start_verification_bp = Blueprint("start_verification_bp", __name__)

@start_verification_bp.route("/start_verification", methods=["POST"])
def start_verify():
    phone = request.json.get('phone_number') # e.g., +91XXXXXXXXXX
    verification = client.verify.v2.services(os.getenv("TWILIO_VERIFY_SID")).verifications.create(to=phone, channel='sms')

    return jsonify({"status": verification.status}) # returns 'pending'

check_verification_bp = Blueprint("check_verification_bp", __name__)

# To finish: User enters code -> You check with Twilio
@check_verification_bp.route('/check-verify', methods=['POST'])
def check_verify():
    name = request.json.get("name")
    phone = request.json.get('phone_number')
    code = request.json.get('otp_code')
    
    verification_check = client.verify.v2.services(os.getenv('TWILIO_VERIFY_SID')).verification_checks.create(to=phone, code=code)
    
    if verification_check.status == 'approved':
        # Now you can create a session or token for the user to keep them logged in
        # Check if user already exists
        existing_user = users_collection.find_one({
            "phone_number": phone
        })

        if not existing_user:

            users_collection.insert_one({
                "name": name,
                "phone_number": phone
            })
        token = jwt.encode(
            {
                "name": name,
                "phone_number": phone,

                # token expiry
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(days=7)

            },

            os.getenv("JWT_SECRET"),

            algorithm="HS256"
        )
        return jsonify({"message": "Login Successful","token":token}), 200
    return jsonify({"message": "Invalid Code"}), 401

@check_verification_bp.route("/profile")
def profile():

    auth_header = request.headers.get("Authorization")

    if not auth_header:

        return jsonify({
            "message": "No token"
        }), 401

    token = auth_header.split(" ")[1]

    try:

        decoded = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )

        return jsonify({
            "name": decoded["name"],
            "phone_number": decoded["phone_number"]
        })

    except jwt.ExpiredSignatureError:

        return jsonify({
            "message": "Token expired"
        }), 401

    except jwt.InvalidTokenError:

        return jsonify({
            "message": "Invalid token"
        }), 401