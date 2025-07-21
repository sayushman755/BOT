import os
import fitz  # PyMuPDF
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def query_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY
    headers = {"Content-Type": "application/json"}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    response = requests.post(url, headers=headers, json=data)
    try:
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except:
        return "Error: Unable to fetch response"

def extract_text_from_pdf(content):
    doc = fitz.open("pdf", content)
    text = ""
    for page in doc:
        text += page.get_text()
    return text
