"""
VARUNETRA Authentication & Role-Based Access Control (RBAC) Module
Problem Statement SIH26085: Urban Flood Nowcasting System

Production-safe authentication boundary:
- HMAC-SHA256 tamper-proof JWT tokens
- Explicit status codes (401 Unauthorized / 403 Forbidden); zero assertions used
- Strict role-based enforcement: CITIZEN, DISASTER_AUTHORITY, MUNICIPAL_OFFICER, RESCUE_TEAM, FIELD_OFFICER, ADMINISTRATOR
- Demo login strictly isolated behind DATA_MODE=DEMO
"""

import hmac
import hashlib
import base64
import json
import time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import HTTPException, status, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets

from app.core.config import settings, DataProvenance, UserRole


def hash_password(password: str) -> str:
    """Computes a cryptographically salted PBKDF2-HMAC-SHA256 password hash."""
    salt = secrets.token_hex(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifies a plain-text password against a salted PBKDF2-HMAC-SHA256 hash in constant time."""
    try:
        parts = password_hash.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = parts[2]
        expected_hash = parts[3]
        derived = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), iterations)
        return hmac.compare_digest(derived.hex(), expected_hash)
    except Exception:
        return False


# Security Scheme
security_bearer = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    user_id: str
    username: str
    role: UserRole
    full_name: str
    email: Optional[str] = None


class TokenPayload(BaseModel):
    sub: str
    username: str
    role: UserRole
    full_name: str
    exp: int
    iat: int


class LoginRequest(BaseModel):
    username: str
    password: str


class DemoLoginRequest(BaseModel):
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in_seconds: int
    user: AuthUser


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def create_access_token(
    user_id: str,
    username: str,
    role: UserRole,
    full_name: str,
    expires_minutes: Optional[int] = None
) -> str:
    """Creates an HMAC-SHA256 signed JWT token."""
    secret = settings.AUTH_SECRET_KEY
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication secret key is unconfigured on the server."
        )

    now = int(time.time())
    ttl_seconds = (expires_minutes or settings.AUTH_TOKEN_EXPIRE_MINUTES) * 60
    exp = now + ttl_seconds

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "username": username,
        "role": role.value,
        "full_name": full_name,
        "iat": now,
        "exp": exp,
    }

    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def verify_token(token: str) -> TokenPayload:
    """
    Validates token signature, structure, and expiration without assertions.
    Raises HTTPException(401) on any failure.
    """
    secret = settings.AUTH_SECRET_KEY
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication secret key is unconfigured on the server."
        )

    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed authentication token structure.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    header_b64, payload_b64, sig_b64 = parts

    # 1. Verify Signature
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _base64url_encode(expected_sig)

    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature. Authentication refused.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Decode Payload
    try:
        payload_bytes = _base64url_decode(payload_b64)
        payload_dict = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload encoding.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Expiration Check
    now = int(time.time())
    exp = payload_dict.get("exp", 0)
    if exp < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Role Validation
    role_val = payload_dict.get("role")
    try:
        role = UserRole(role_val)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unknown or unauthorized user role '{role_val}'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenPayload(
        sub=payload_dict.get("sub", ""),
        username=payload_dict.get("username", ""),
        role=role,
        full_name=payload_dict.get("full_name", ""),
        exp=exp,
        iat=payload_dict.get("iat", 0),
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> AuthUser:
    """Dependency that extracts and validates the authenticated user from the Authorization header."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided. Include 'Authorization: Bearer <token>' header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(credentials.credentials)
    return AuthUser(
        user_id=payload.sub,
        username=payload.username,
        role=payload.role,
        full_name=payload.full_name,
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Optional[AuthUser]:
    """Dependency for public endpoints that capture user identity if authenticated."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        return AuthUser(
            user_id=payload.sub,
            username=payload.username,
            role=payload.role,
            full_name=payload.full_name,
        )
    except HTTPException:
        return None


def require_roles(allowed_roles: List[UserRole]):
    """Role-based authorization dependency factory (strict)."""
    async def role_checker(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if current_user.role not in allowed_roles:
            role_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role.value}' lacks required privilege. Permitted roles: {role_names}."
            )
        return current_user
    return role_checker


async def get_current_user_with_mode(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> AuthUser:
    """
    Mode-aware user dependency:
    - In non-DEMO modes (REAL, SIMULATED): Strictly requires a valid Bearer token.
    - In DEMO mode: If a Bearer token is provided, strictly verifies it; if omitted, provides fallback demo operator.
    """
    if credentials and credentials.credentials:
        payload = verify_token(credentials.credentials)
        return AuthUser(
            user_id=payload.sub,
            username=payload.username,
            role=payload.role,
            full_name=payload.full_name,
        )

    if settings.DATA_MODE == DataProvenance.DEMO:
        return AuthUser(
            user_id="DEMO-OPERATOR",
            username="demo_admin",
            role=UserRole.ADMINISTRATOR,
            full_name="Demonstration Operator (Auto-Session)",
            email="demo@varunetra.local",
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication credentials required. Include 'Authorization: Bearer <token>' header.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_roles_with_mode(allowed_roles: List[UserRole]):
    """Mode-aware role check: strict in REAL mode, respects passed token in DEMO mode."""
    async def role_checker(current_user: AuthUser = Depends(get_current_user_with_mode)) -> AuthUser:
        if current_user.role not in allowed_roles:
            role_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role.value}' lacks required privilege. Permitted roles: {role_names}."
            )
        return current_user
    return role_checker


# Predefined baseline accounts for system operations
DEMO_ROLE_PROFILES: Dict[UserRole, Dict[str, str]] = {
    UserRole.ADMINISTRATOR: {"name": "System Administrator", "username": "admin"},
    UserRole.DISASTER_AUTHORITY: {"name": "Disaster Management Officer (SDMA)", "username": "dma_officer"},
    UserRole.MUNICIPAL_OFFICER: {"name": "Municipal Drainage Engineer", "username": "municipal_eng"},
    UserRole.RESCUE_TEAM: {"name": "SDRF Water Rescue Squad Lead", "username": "sdrf_lead"},
    UserRole.FIELD_OFFICER: {"name": "Urban Field Verification Officer", "username": "field_officer"},
    UserRole.CITIZEN: {"name": "Registered Citizen (Patna)", "username": "citizen_patna"},
}
