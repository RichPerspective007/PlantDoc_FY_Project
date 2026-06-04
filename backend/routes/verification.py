from flask import request, jsonify, Blueprint
import os
import jwt
import datetime
from dotenv import load_dotenv
from twilio.rest import Client
from utils.load_mongo_client import get_db

load_dotenv()

db = get_db()
users_collection = db["users"]

#secret = os.getenv("JWT_SECRET")

client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))

start_verification_bp = Blueprint("start_verification_bp", __name__)

@start_verification_bp.route("/start_verification", methods=["POST"])
def start_verify():
    phone = request.json.get('phone_number') # e.g., +91XXXXXXXXXX
    existing_user = users_collection.find_one({
        "phone_number": phone
    })
    response_dict = dict()
    if existing_user:
        response_dict["existing_user"] = True
        response_dict["name"] = existing_user["name"]
    else:
        response_dict["existing_user"] = False

    verification = client.verify.v2.services(os.getenv("TWILIO_VERIFY_SID")).verifications.create(to=phone, channel='sms')

    return jsonify({"status": verification.status, **response_dict}) # returns 'pending'

check_verification_bp = Blueprint("check_verification_bp", __name__)

@check_verification_bp.route('/check-verify', methods=['POST'])
def check_verify():

    name = request.json.get("name")
    phone = request.json.get('phone_number')
    code = request.json.get('otp_code')

    verification_check = client.verify.v2.services(
        os.getenv('TWILIO_VERIFY_SID')
    ).verification_checks.create(
        to=phone,
        code=code
    )

    if verification_check.status == 'approved':

        existing_user = users_collection.find_one({
            "phone_number": phone
        })

        if not existing_user:

            users_collection.insert_one({
                "name": name,
                "phone_number": phone
            })

        else:
            name = existing_user["name"]

        token = jwt.encode(
            {
                "name": name,
                "phone_number": phone,

                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(seconds=10)

            },

            os.getenv("JWT_SECRET"),

            algorithm="HS256"
        )

        return jsonify({
            "message": "Login Successful",
            "name": name,
            "phone_number": phone,
            "token": token
        }), 200

    return jsonify({
        "message": "Invalid Code"
    }), 401

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