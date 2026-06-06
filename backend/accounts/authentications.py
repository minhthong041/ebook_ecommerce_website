import jwt
from datetime import datetime, timezone
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from .models import UserTokenFamily

User = get_user_model()

class BaseJWTAuthentication(authentication.BaseAuthentication):
    def get_token_from_request(self, request, cookie_name):
        return request.COOKIES.get(cookie_name)

    def authenticate_header(self, request):
        return 'Bearer'

    def decode_token(self, token, options=None):
        try:
            return jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=["HS256"],
                options=options
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired", code="token_expired")
        except jwt.DecodeError:
            raise AuthenticationFailed("Error decoding signature", code="token_invalid")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid token", code="token_invalid")

    def enforce_csrf(self, request):
        return None 



class JWTAuthentication(BaseJWTAuthentication):
    """
    Guard for Bearer access_token securely stored in HttpOnly cookie.
    Used for general endpoints like GET /api/auth/me/
    """
    def authenticate(self, request):
        token = self.get_token_from_request(request, "access_token")
        if not token:
            return None

        payload = self.decode_token(token)
        user_id = payload.get("user_id")
        family_id = payload.get("family_id")

        if not user_id or not family_id:
            raise AuthenticationFailed("Invalid payload", code="invalid_payload")

        # Check if Token Family is compromised
        try:
            family = UserTokenFamily.objects.get(id=family_id)
            if family.is_revoked:
                raise AuthenticationFailed("Token family has been revoked (e.g., logged out)", code="family_revoked")
        except UserTokenFamily.DoesNotExist:
            raise AuthenticationFailed("Token family not found", code="family_not_found")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive", code="user_inactive")

        return (user, payload)

class JWTRefreshAuthentication(BaseJWTAuthentication):
    """
    Guard for refresh_token securely stored in HttpOnly cookie.
    Only used for Refresh endpoint.
    """
    def authenticate(self, request):
        token = self.get_token_from_request(request, "refresh_token")
        if not token:
            raise AuthenticationFailed("Refresh token is required", code="refresh_required")

        payload = self.decode_token(token)
        user_id = payload.get("user_id")
        family_id = payload.get("family_id")

        if not user_id or not family_id:
            raise AuthenticationFailed("Invalid payload", code="invalid_payload")

        # Check Token Family
        try:
            family = UserTokenFamily.objects.get(id=family_id)
            if family.is_revoked:
                raise AuthenticationFailed("Token family has been revoked (e.g., logged out)", code="family_revoked")
        except UserTokenFamily.DoesNotExist:
            raise AuthenticationFailed("Token family not found", code="family_not_found")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found", code="user_not_found")

        return (user, payload)

class JWTSoftAuthentication(BaseJWTAuthentication):
    """
    Guard for logout endpoint. Needs to ignore ExpiredSignatureError so logout can always proceed.
    """
    def authenticate(self, request):
        token = self.get_token_from_request(request, "access_token")
        if not token:
            token = self.get_token_from_request(request, "refresh_token")
            
        if not token:
            return None
            
        # Ignore expiration constraint for soft strategy
        try:
            payload = self.decode_token(token, options={"verify_exp": False})
        except AuthenticationFailed:
            return None

        user_id = payload.get("user_id")
        
        try:
            user = User.objects.get(id=user_id)
            return (user, payload)
        except User.DoesNotExist:
            return None
