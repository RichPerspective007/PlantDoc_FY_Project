from flask import Blueprint, redirect, url_for, session
from authlib.integrations.flask_client import OAuth
import json
import os

auth_bp = Blueprint('auth', __name__)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


with open("google_auth_api.json") as f:
    data = json.load(f)

oauth = OAuth()

google = oauth.register(
    name='google',
    client_id=data["web"]["client_id"],
    client_secret=data["web"]["client_secret"],
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

@auth_bp.route('/login')
def login():
    return google.authorize_redirect(url_for('auth.callback', _external=True))


@auth_bp.route('/callback')
def callback():
    token = google.authorize_access_token()
    user = google.get('userinfo').json()

    session['user'] = user

    return redirect(f"http://127.0.0.1:5000/callback")


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect("http://localhost:3000")





