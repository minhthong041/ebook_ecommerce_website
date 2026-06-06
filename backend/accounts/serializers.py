from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import DisallowedHost

from .models import Role

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField()
    phone_number = serializers.CharField()
    dob = serializers.DateField()

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'full_name',
            'phone_number',
            'dob',
            'password',
            'confirm_password',
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Mật khẩu xác nhận không khớp."}
            )
        validate_password(attrs["password"])
        return attrs

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return normalized

    def validate_phone_number(self, value):
        normalized = value.strip()
        if User.objects.filter(phone_number=normalized).exists():
            raise serializers.ValidationError("Số điện thoại này đã được sử dụng.")
        return normalized

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        customer_role, _ = Role.objects.get_or_create(name="Customer")
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            role=customer_role,
        )
        if 'phone_number' in validated_data:
            user.phone_number = validated_data['phone_number']
        if 'dob' in validated_data:
            user.dob = validated_data['dob']
            
        # Hashes the password!
        user.set_password(validated_data['password'])
        user.save()
        # Customer creation is handled by post_save signal in models
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("email") or attrs.get("username")
        if not identifier:
            raise serializers.ValidationError("Email or username is required.")
        attrs["identifier"] = identifier.strip()
        return attrs

class UserMeSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role.name", read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'avatar',
            'avatar_url',
            'phone_number',
            'dob',
            'date_joined',
            'role',
            'is_staff',
            'is_superuser',
        ]
        read_only_fields = [
            'id',
            'date_joined',
            'username',
            'role',
            'is_staff',
            'is_superuser',
            'avatar_url',
        ]

    def to_internal_value(self, data):
        mutable_data = data.copy()
        if mutable_data.get("dob") == "":
            mutable_data["dob"] = None
        return super().to_internal_value(mutable_data)

    def get_avatar_url(self, obj):
        stored_avatar = obj.avatar_url or {}
        stored_url = None
        if isinstance(stored_avatar, dict):
            stored_url = stored_avatar.get("url")
        elif isinstance(stored_avatar, str):
            stored_url = stored_avatar

        if stored_url:
            return self._build_absolute_url(stored_url)

        if not obj.avatar:
            return None

        return self._build_absolute_url(obj.avatar.url)

    def _build_absolute_url(self, url):
        if url.startswith(("http://", "https://")):
            return url

        request = self.context.get("request")
        if request:
            try:
                return request.build_absolute_uri(url)
            except DisallowedHost:
                return url
        return url

    def _build_file_payload(self, file_field):
        if not file_field:
            return {}
        return {
            "url": file_field.url,
            "path": file_field.name,
            "storage": "local",
        }

    def validate_email(self, value):
        normalized = value.strip().lower()
        existing_user = User.objects.filter(email__iexact=normalized).exclude(
            pk=self.instance.pk if self.instance else None
        )
        if existing_user.exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return normalized

    def validate_phone_number(self, value):
        if value in ("", None):
            return None

        normalized = value.strip()
        existing_user = User.objects.filter(phone_number=normalized).exclude(
            pk=self.instance.pk if self.instance else None
        )
        if existing_user.exists():
            raise serializers.ValidationError("Số điện thoại này đã được sử dụng.")
        return normalized

    def update(self, instance, validated_data):
        old_avatar = instance.avatar
        new_avatar = validated_data.get("avatar")
        updated_instance = super().update(instance, validated_data)

        if new_avatar and old_avatar and old_avatar.name != updated_instance.avatar.name:
            old_avatar.delete(save=False)
        if new_avatar:
            updated_instance.avatar_url = self._build_file_payload(updated_instance.avatar)
            updated_instance.save(update_fields=["avatar_url"])

        return updated_instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu hiện tại không chính xác.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Mật khẩu xác nhận không khớp."}
            )
        validate_password(attrs["new_password"], self.context["request"].user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name"]


class StaffUserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.IntegerField(source="role.id", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone_number",
            "dob",
            "date_joined",
            "role",
            "role_id",
            "is_active",
            "is_staff",
            "is_superuser",
        ]


class StaffUserUpdateSerializer(serializers.ModelSerializer):
    role_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "phone_number",
            "dob",
            "role_id",
            "is_active",
            "is_staff",
        ]

    def validate_role_id(self, value):
        if value is None:
            return None
        if not Role.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Role không tồn tại.")
        return value

    def validate_email(self, value):
        normalized = value.strip().lower()
        existing_user = User.objects.filter(email__iexact=normalized).exclude(
            pk=self.instance.pk if self.instance else None
        )
        if existing_user.exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return normalized

    def validate_phone_number(self, value):
        if value in ("", None):
            return None
        normalized = value.strip()
        existing_user = User.objects.filter(phone_number=normalized).exclude(
            pk=self.instance.pk if self.instance else None
        )
        if existing_user.exists():
            raise serializers.ValidationError("Số điện thoại này đã được sử dụng.")
        return normalized

    def update(self, instance, validated_data):
        role_id = validated_data.pop("role_id", serializers.empty)
        if role_id is not serializers.empty:
            instance.role = Role.objects.filter(pk=role_id).first() if role_id else None
        return super().update(instance, validated_data)
