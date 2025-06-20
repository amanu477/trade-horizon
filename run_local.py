import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app import app

if __name__ == "__main__":
    # Run with debug mode for development
    app.run(host="127.0.0.1", port=5000, debug=True)