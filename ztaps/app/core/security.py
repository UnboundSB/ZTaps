import os
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY", "dummy_api_key_for_testing")

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    """
    Demo Mode: Bypassing API key verification.
    """
    return True
