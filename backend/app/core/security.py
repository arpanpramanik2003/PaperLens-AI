import os
import time
import httpx
import jwt
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY")
CLERK_AUDIENCE = os.environ.get("CLERK_AUDIENCE")
CLERK_ISSUER = os.environ.get("CLERK_ISSUER")

security = HTTPBearer()
jwks_cache = {}
jwks_last_fetched = 0.0
JWKS_CACHE_TTL = 900  # 15 minutes TTL

def get_jwks(force_refresh: bool = False):
    global jwks_last_fetched
    now = time.time()
    if force_refresh or not jwks_cache or (now - jwks_last_fetched) > JWKS_CACHE_TTL:
        try:
            headers = {}
            if CLERK_SECRET_KEY:
                headers["Authorization"] = f"Bearer {CLERK_SECRET_KEY}"
            response = httpx.get(
                "https://api.clerk.com/v1/jwks",
                headers=headers,
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            jwks_cache.clear()
            jwks_cache.update(data)
            jwks_last_fetched = now
        except Exception as e:
            print(f"Error fetching JWKS from Clerk: {e}")
    return jwks_cache

def verify_token(token: str):
    jwks = get_jwks()
    if not jwks:
        raise HTTPException(status_code=500, detail="Could not fetch JWKS from Clerk")
    
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token header")
        
    kid = unverified_header.get("kid")
    rsa_key = {}
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
            break
            
    # If key ID is unknown, force-refresh JWKS once in case of recent key rotation
    if not rsa_key:
        refreshed_jwks = get_jwks(force_refresh=True)
        for key in refreshed_jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break

    if not rsa_key:
        raise HTTPException(status_code=401, detail="Unable to find appropriate key")
        
    try:
        public_key = RSAAlgorithm.from_jwk(rsa_key)
        
        decode_kwargs = {
            "algorithms": ["RS256"],
            "options": {"verify_aud": True if CLERK_AUDIENCE else False}
        }
        if CLERK_AUDIENCE:
            decode_kwargs["audience"] = CLERK_AUDIENCE
        if CLERK_ISSUER:
            decode_kwargs["issuer"] = CLERK_ISSUER

        payload = jwt.decode(token, public_key, **decode_kwargs)
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    payload = verify_token(token)
    return payload.get("sub")

async def get_current_user_from_token(
    token: str = None,
    credentials: HTTPAuthorizationCredentials = Security(HTTPBearer(auto_error=False))
):
    raw_token = None
    if credentials:
        raw_token = credentials.credentials
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(status_code=401, detail="Authentication token missing")

    payload = verify_token(raw_token)
    return payload.get("sub")
