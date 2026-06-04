from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, LoginSerializer, UserMeSerializer
from .authentications import JWTAuthentication, JWTRefreshAuthentication, JWTSoftAuthentication
from .models import UserTokenFamily
from django.contrib.auth import authenticate
from django.conf import settings
from datetime import datetime, timezone
import jwt

def get_tokens_for_user(user, family_id):
    algo = "HS256"
    access_exp = datetime.now(timezone.utc) + settings.JWT_ACCESS_EXPIRATION
    refresh_exp = datetime.now(timezone.utc) + settings.JWT_REFRESH_EXPIRATION

    access_payload = {
        "user_id": user.id,
        "family_id": str(family_id),
        "exp": access_exp,
        "type": "access"
    }

    refresh_payload = {
        "user_id": user.id,
        "family_id": str(family_id),
        "exp": refresh_exp,
        "type": "refresh"
    }

    access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm=algo)
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm=algo)

    return access_token, refresh_token


def set_auth_cookies(response, access_token, refresh_token):
    # max_age in seconds
    access_max_age = int(settings.JWT_ACCESS_EXPIRATION.total_seconds())
    refresh_max_age = int(settings.JWT_REFRESH_EXPIRATION.total_seconds())

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=access_max_age,
        httponly=True,
        samesite="Lax"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=True,
        samesite="Lax"
    )
    return response


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            family = UserTokenFamily.objects.create(user=user)
            access_token, refresh_token = get_tokens_for_user(user, family.id)
            
            response = Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
            return set_auth_cookies(response, access_token, refresh_token)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            # Use custom backend if needed or default auth
            # Assuming backend uses email -> we might need to filter user first, standard `authenticate` uses username usually.
            # Let's handle email to username mapping
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_obj = User.objects.filter(email=email).first()
            if not user_obj:
                return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
            
            auth_user = authenticate(username=user_obj.username, password=password)

            if auth_user is not None:
                family = UserTokenFamily.objects.create(user=auth_user)
                access_token, refresh_token = get_tokens_for_user(auth_user, family.id)

                response = Response({"message": "Login successful"}, status=status.HTTP_200_OK)
                return set_auth_cookies(response, access_token, refresh_token)
                
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
    authentication_classes = [JWTRefreshAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        payload = getattr(request, "auth", {})
        family_id = payload.get("family_id")

        if not family_id:
            return Response({"detail": "Invalid payload format."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            family = UserTokenFamily.objects.get(id=family_id)
            # Revoke current family and create new
            family.is_revoked = True
            family.save()

            new_family = UserTokenFamily.objects.create(user=user)
            access_token, refresh_token = get_tokens_for_user(user, new_family.id)

            response = Response({"message": "Tokens refreshed"}, status=status.HTTP_200_OK)
            return set_auth_cookies(response, access_token, refresh_token)
        except UserTokenFamily.DoesNotExist:
            return Response({"detail": "Token family not found."}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserMeSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    authentication_classes = [JWTSoftAuthentication]
    
    def post(self, request):
        payload = getattr(request, "auth", {})
        if payload:
            family_id = payload.get("family_id")
            if family_id:
                try:
                    family = UserTokenFamily.objects.get(id=family_id)
                    family.is_revoked = True
                    family.save()
                except UserTokenFamily.DoesNotExist:
                    pass

        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


class LogoutAllView(APIView):
    authentication_classes = [JWTSoftAuthentication]

    def post(self, request):
        user = request.user
        if getattr(user, "is_authenticated", False):
            # Revoke all token families for this user
            UserTokenFamily.objects.filter(user=user, is_revoked=False).update(is_revoked=True)
        
        response = Response({"message": "Logged out from all devices"}, status=status.HTTP_200_OK)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response

