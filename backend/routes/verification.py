from flask import request, jsonify, Blueprint
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

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
    phone = request.json.get('phone_number')
    code = request.json.get('otp_code')
    
    verification_check = client.verify.v2.services(os.getenv('TWILIO_VERIFY_SID')).verification_checks.create(to=phone, code=code)
    
    if verification_check.status == 'approved':
        # Now you can create a session or token for the user to keep them logged in
        return jsonify({"message": "Login Successful"}), 200
    return jsonify({"message": "Invalid Code"}), 401