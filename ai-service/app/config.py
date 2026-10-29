import os

AI_PROVIDER = os.getenv("AI_PROVIDER", "baseline").lower()  # baseline, gemini, openai
AI_API_KEY = os.getenv("AI_API_KEY", "").strip()
AI_MODEL = os.getenv("AI_MODEL", "gemini-1.5-flash" if AI_PROVIDER == "gemini" else "gpt-4o-mini")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

