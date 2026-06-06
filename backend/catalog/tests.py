from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, UserTokenFamily
from accounts.views import get_tokens_for_user

from .models import (
    Book,
    BookCategory,
    BookReview,
    Category,
    Publisher,
)
from .serializers import BookListSerializer, CategorySerializer


def create_customer(username):
    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="ReadifyPass123!",
        full_name=f"{username} Reader",
    )
    return user.customer


def create_book(title, publisher=None, price="79000.00"):
    publisher = publisher or Publisher.objects.create(name=f"Publisher {title}")
    return Book.objects.create(
        title=title,
        publisher=publisher,
        price=price,
        year_of_publication=2024,
        description="Test ebook",
    )


class CategorySerializerUnitTests(TestCase):
    def test_serializer_exposes_annotated_book_count(self):
        category = Category.objects.create(name="Triết học")
        category.book_count = 5

        data = CategorySerializer(category).data

        self.assertEqual(data["book_count"], 5)


class BookListSerializerUnitTests(TestCase):
    def test_rating_summary_uses_only_approved_purchased_reviews(self):
        book = create_book("Nietzsche")
        BookReview.objects.create(
            customer=create_customer("approved_one"),
            book=book,
            rating=5,
            title="Hay",
            comment="Rất đáng đọc",
            is_purchased=True,
            status=BookReview.Status.APPROVED,
        )
        BookReview.objects.create(
            customer=create_customer("approved_two"),
            book=book,
            rating=3,
            title="Ổn",
            comment="Nội dung tốt",
            is_purchased=True,
            status=BookReview.Status.APPROVED,
        )
        BookReview.objects.create(
            customer=create_customer("pending_reader"),
            book=book,
            rating=1,
            title="Chưa duyệt",
            comment="Không được tính",
            is_purchased=True,
            status=BookReview.Status.PENDING,
        )
        BookReview.objects.create(
            customer=create_customer("unpurchased_reader"),
            book=book,
            rating=1,
            title="Chưa mua",
            comment="Không được tính",
            is_purchased=False,
            status=BookReview.Status.APPROVED,
        )

        data = BookListSerializer(book).data

        self.assertEqual(data["average_rating"], 4.0)
        self.assertEqual(data["review_count"], 2)


class CategoryApiIntegrationTests(APITestCase):
    def test_category_list_returns_book_count_ordered_descending(self):
        publisher = Publisher.objects.create(name="Readify Publisher")
        philosophy = Category.objects.create(name="Triết học")
        business = Category.objects.create(name="Kinh doanh")
        empty_category = Category.objects.create(name="Chưa có sách")
        first_book = create_book("Book A", publisher=publisher)
        second_book = create_book("Book B", publisher=publisher)

        BookCategory.objects.create(book=first_book, category=philosophy)
        BookCategory.objects.create(book=second_book, category=philosophy)
        BookCategory.objects.create(book=second_book, category=business)

        response = self.client.get(reverse("category-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload[0]["id"], philosophy.id)
        self.assertEqual(payload[0]["book_count"], 2)
        self.assertEqual(payload[1]["id"], business.id)
        self.assertEqual(payload[1]["book_count"], 1)
        self.assertIn(
            {"id": empty_category.id, "name": "Chưa có sách", "parent": None, "children": [], "book_count": 0},
            payload,
        )


class AdminCategoryApiIntegrationTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="category_admin",
            email="category_admin@example.com",
            password="ReadifyPass123!",
        )
        family = UserTokenFamily.objects.create(user=self.admin)
        access_token, _ = get_tokens_for_user(self.admin, family.id)
        self.client.cookies["access_token"] = access_token

    def test_admin_can_create_and_update_category(self):
        parent = Category.objects.create(name="Sách chuyên ngành")

        create_response = self.client.post(
            reverse("admin-category-list"),
            {"name": "Công nghệ", "parent": parent.id},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        category_id = create_response.data["id"]
        self.assertEqual(create_response.data["parent"], parent.id)
        self.assertEqual(create_response.data["parent_name"], parent.name)

        update_response = self.client.patch(
            reverse("admin-category-detail", args=[category_id]),
            {"name": "Công nghệ thông tin"},
            format="json",
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["name"], "Công nghệ thông tin")
