from datetime import datetime, timezone

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    ChangePasswordSerializer,
    RegisterSerializer,
    LoginSerializer,
    RoleSerializer,
    StaffUserSerializer,
    StaffUserUpdateSerializer,
    UserMeSerializer,
)
from .authentications import JWTAuthentication, JWTRefreshAuthentication, JWTSoftAuthentication
from .models import Role, UserTokenFamily
from .permissions import IsSystemAdmin
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
            
            response = Response(
                {
                    "message": "User registered successfully",
                    "user": UserMeSerializer(user, context={"request": request}).data,
                },
                status=status.HTTP_201_CREATED,
            )
            return set_auth_cookies(response, access_token, refresh_token)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            identifier = serializer.validated_data["identifier"]
            password = serializer.validated_data['password']

            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_obj = (
                User.objects.filter(email__iexact=identifier).first()
                or User.objects.filter(username__iexact=identifier).first()
            )
            if not user_obj:
                return Response(
                    {"detail": "Sai thông tin đăng nhập."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            
            auth_user = authenticate(username=user_obj.username, password=password)

            if auth_user is not None:
                family = UserTokenFamily.objects.create(user=auth_user)
                access_token, refresh_token = get_tokens_for_user(auth_user, family.id)

                response = Response(
                    {
                        "message": "Login successful",
                        "user": UserMeSerializer(auth_user, context={"request": request}).data,
                    },
                    status=status.HTTP_200_OK,
                )
                return set_auth_cookies(response, access_token, refresh_token)
                
            return Response(
                {"detail": "Sai thông tin đăng nhập."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
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
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserMeSerializer(request.user, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserMeSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password changed successfully."},
                status=status.HTTP_200_OK,
            )
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


class AdminRoleListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        roles = Role.objects.order_by("name")
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSystemAdmin]

    def get(self, request):
        User = get_user_model()
        query = request.query_params.get("q", "").strip()
        role = request.query_params.get("role", "").strip()
        status_filter = request.query_params.get("status", "").strip().lower()
        users = User.objects.select_related("role").order_by("-date_joined")

        if query:
            users = users.filter(
                Q(username__icontains=query)
                | Q(full_name__icontains=query)
                | Q(email__icontains=query)
                | Q(phone_number__icontains=query)
            )
        if role and role != "all":
            if role == "none":
                users = users.filter(role__isnull=True)
            else:
                users = users.filter(role_id=role)
        if status_filter == "active":
            users = users.filter(is_active=True)
        elif status_filter == "inactive":
            users = users.filter(is_active=False)

        serializer = StaffUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSystemAdmin]

    def get_object(self, pk):
        User = get_user_model()
        return User.objects.select_related("role").get(pk=pk)

    def patch(self, request, pk):
        try:
            user = self.get_object(pk)
        except get_user_model().DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StaffUserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_user = serializer.save()
        response_serializer = StaffUserSerializer(updated_user)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


