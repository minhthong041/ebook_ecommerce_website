from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, UserTokenFamily
from accounts.views import get_tokens_for_user
from catalog.models import Book, Publisher
from library.models import UserLibrary, UserLibraryItem
from orders.models import OrderLine, ShopOrder
from orders.services import ORDER_STATUS_PENDING, get_order_status


def create_book(title="Test Book"):
    publisher = Publisher.objects.create(name=f"{title} Publisher")
    return Book.objects.create(
        title=title,
        publisher=publisher,
        price="79000.00",
        year_of_publication=2024,
        description="Test ebook",
    )


class CartIntegrationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="cart_user",
            email="cart_user@example.com",
            full_name="Cart User",
            password="ReadifyPass123!",
        )
        family = UserTokenFamily.objects.create(user=self.user)
        access_token, _ = get_tokens_for_user(self.user, family.id)
        self.client.cookies["access_token"] = access_token

    def test_cannot_add_purchased_book_to_cart(self):
        book = create_book("Purchased Book")
        library = UserLibrary.objects.create(
            customer=self.user.customer,
            name="My Library",
        )
        UserLibraryItem.objects.create(library=library, book=book)

        response = self.client.post(
            reverse("cart-item-list"),
            {"book_id": book.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("đã có trong thư viện", str(response.data))

    def test_cannot_add_book_with_active_pending_order_to_cart(self):
        book = create_book("Pending Book")
        order = ShopOrder.objects.create(
            customer=self.user.customer,
            total_price=book.price,
            discount_amount=0,
            order_status=get_order_status(ORDER_STATUS_PENDING),
        )
        OrderLine.objects.create(order=order, book=book, price=book.price)

        response = self.client.post(
            reverse("cart-item-list"),
            {"book_id": book.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("đơn chờ thanh toán", str(response.data))
