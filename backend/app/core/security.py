import os
import httpx
import jwt
from jwt.algorithms import RSAAlgorithm
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY")

security = HTTPBearer()
jwks_cache = {}

def get_jwks():
    if not jwks_cache:
        try:
            response = httpx.get(
                "https://api.clerk.com/v1/jwks",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
            )
            response.raise_for_status()
            jwks_cache.update(response.json())
        except Exception as e:
            print(f"Error fetching JWKS: {e}")
    return jwks_cache

def verify_token(token: str):
    jwks = get_jwks()
    if not jwks:
        raise HTTPException(status_code=500, detail="Could not fetch JWKS from Clerk")
    
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token header")
        
    rsa_key = {}
    for key in jwks.get("keys", []):
        if key["kid"] == unverified_header.get("kid"):
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
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    payload = verify_token(token)
    return payload.get("sub")
