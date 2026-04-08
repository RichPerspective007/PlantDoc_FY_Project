import google.generativeai as genai
from dotenv import load_dotenv
import os
load_dotenv()

GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model_genai=genai.GenerativeModel('gemini-3-flash-preview')

def get_model_genai():
    return model_genai