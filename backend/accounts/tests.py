from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Customer, Role, User, UserTokenFamily
from .views import get_tokens_for_user


class AuthIntegrationTests(APITestCase):
    def test_register_assigns_customer_role_and_creates_profile(self):
        payload = {
            "username": "reader01",
            "email": "reader01@example.com",
            "full_name": "Reader One",
            "phone_number": "0900000001",
            "dob": "2000-01-15",
            "password": "ReadifyPass123!",
            "confirm_password": "ReadifyPass123!",
        }

        response = self.client.post(reverse("register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="reader01")
        self.assertEqual(user.email, "reader01@example.com")
        self.assertEqual(user.full_name, "Reader One")
        self.assertEqual(user.role.name, "Customer")
        self.assertTrue(Customer.objects.filter(user=user).exists())
        self.assertTrue(Role.objects.filter(name="Customer").exists())
        self.assertIn("access_token", response.cookies)
        self.assertNotIn("password", response.data["user"])

    def test_login_with_wrong_password_returns_generic_error(self):
        User.objects.create_user(
            username="reader02",
            email="reader02@example.com",
            full_name="Reader Two",
            password="ReadifyPass123!",
        )

        response = self.client.post(
            reverse("login"),
            {"username": "reader02", "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "Sai thông tin đăng nhập.")

    def test_register_rejects_duplicate_email_and_phone_number(self):
        User.objects.create_user(
            username="existing_reader",
            email="duplicate@example.com",
            full_name="Existing Reader",
            phone_number="0900000002",
            password="ReadifyPass123!",
        )
        payload = {
            "username": "new_reader",
            "email": "DUPLICATE@example.com",
            "full_name": "New Reader",
            "phone_number": "0900000002",
            "dob": "2000-01-15",
            "password": "ReadifyPass123!",
            "confirm_password": "ReadifyPass123!",
        }

        response = self.client.post(reverse("register"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("phone_number", response.data)

    def test_profile_update_rejects_email_and_phone_from_another_account(self):
        owner = User.objects.create_user(
            username="profile_owner",
            email="owner@example.com",
            full_name="Profile Owner",
            phone_number="0900000003",
            password="ReadifyPass123!",
        )
        User.objects.create_user(
            username="profile_other",
            email="other@example.com",
            full_name="Profile Other",
            phone_number="0900000004",
            password="ReadifyPass123!",
        )
        family = UserTokenFamily.objects.create(user=owner)
        access_token, _ = get_tokens_for_user(owner, family.id)
        self.client.cookies["access_token"] = access_token

        response = self.client.patch(
            reverse("me"),
            {
                "email": "other@example.com",
                "phone_number": "0900000004",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertIn("phone_number", response.data)
