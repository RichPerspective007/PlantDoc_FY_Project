# PlantDoc
Detection of plant diseases from leaf images using DL models

# Environment Setup

## Backend Setup

Step 1: Go to the backend directory from root directory

`cd backend`

Step 2: Create virtual environment

`python -m venv .plantdoc-venv`

Step 3: Activate virtual environment

Windows: `.plantdoc-venv\Scripts\activate`
Linux: `source .plantdoc-venv/Scripts/activate`

Step 4: Download required libraries

`pip install -r requirement.txt`

Step 5: Environment Variables setup

1. Create a .env file in the backend folder
2. Environment Variables required are `GEMINI_API_KEY` and `HF_TOKEN`, which is the hugging face api token.
The .env file should look like
```
GEMINI_API_KEY=.....
HF_TOKEN=....
```

Step 6: Generating the hugging face and gemini API tokens.

I'll guide you through it on Google Meet.

Step 7: Start the app
```
python app.py                       # or python3 or py or whatever works in your system
```

## Frontend Setup

```
cd frontend
npm install
npm run dev  
```

Then go to http://localhost:5173/ or any other port number as display in your system. Vite uses 5173 by default.

3. cd backend ----> py app.py---> a link will be shown ignore the errors just click the link a window will be opened like (http://localhost:5000/)------> then just add "predict" after the url(http://localhost:5000/)  and will look like ((http://localhost:5000/predict)) then u can go to frontend for prediction because all codes are in local 
4. gemini api key is secret i used mine so u r requested to use ur own geminiapi key ...... else u cant see those soln for diseases