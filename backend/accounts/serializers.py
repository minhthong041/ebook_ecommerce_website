from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'full_name', 'password', 'phone_number', 'dob']

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data['full_name'],
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
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'phone_number', 'dob', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined', 'username']
