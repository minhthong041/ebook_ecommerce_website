from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Role, User
from cart.models import ShoppingCart, ShoppingCartItem
from catalog.models import Book, Publisher

from .models import OrderLine, ShopOrder
from .services import (
    ORDER_STATUS_CANCELLED,
    ORDER_STATUS_PENDING,
    get_active_pending_book_ids,
    get_order_status,
)


def create_book(title):
    publisher = Publisher.objects.create(name=f"{title} Publisher")
    return Book.objects.create(
        title=title,
        publisher=publisher,
        price="79000.00",
        year_of_publication=2024,
        description="Test ebook",
    )


class PendingOrderServiceTests(TestCase):
    def test_get_active_pending_book_ids_expires_old_pending_orders(self):
        user = User.objects.create_user(
            username="order_user",
            email="order_user@example.com",
            full_name="Order User",
            password="ReadifyPass123!",
        )
        active_book = create_book("Active Pending Book")
        expired_book = create_book("Expired Pending Book")
        pending_status = get_order_status(ORDER_STATUS_PENDING)

        active_order = ShopOrder.objects.create(
            customer=user.customer,
            total_price=active_book.price,
            discount_amount=0,
            order_status=pending_status,
        )
        expired_order = ShopOrder.objects.create(
            customer=user.customer,
            total_price=expired_book.price,
            discount_amount=0,
            order_status=pending_status,
        )
        OrderLine.objects.create(
            order=active_order,
            book=active_book,
            price=active_book.price,
        )
        OrderLine.objects.create(
            order=expired_order,
            book=expired_book,
            price=expired_book.price,
        )
        ShopOrder.objects.filter(pk=expired_order.pk).update(
            created_at=timezone.now() - timedelta(minutes=31)
        )

        active_pending_ids = get_active_pending_book_ids(user.customer)

        self.assertEqual(active_pending_ids, {active_book.id})
        expired_order.refresh_from_db()
        self.assertEqual(expired_order.order_status.name, ORDER_STATUS_CANCELLED)


class StaffDashboardStatsPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("staff-dashboard-stats")

    def test_admin_can_view_dashboard_stats(self):
        admin_role = Role.objects.create(name="Admin")
        admin = User.objects.create_superuser(
            username="dashboard_admin",
            email="dashboard_admin@example.com",
            password="ReadifyPass123!",
            full_name="Dashboard Admin",
            role=admin_role,
        )
        self.client.force_authenticate(user=admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_employee_cannot_view_dashboard_stats(self):
        employee_role = Role.objects.create(name="Employee")
        employee = User.objects.create_user(
            username="dashboard_employee",
            email="dashboard_employee@example.com",
            password="ReadifyPass123!",
            full_name="Dashboard Employee",
            role=employee_role,
            is_staff=True,
        )
        self.client.force_authenticate(user=employee)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CheckoutSelectedCartItemsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="selected_checkout_user",
            email="selected_checkout_user@example.com",
            password="ReadifyPass123!",
            full_name="Selected Checkout User",
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse("checkout")

    def test_checkout_only_selected_cart_items(self):
        selected_book = create_book("Selected Checkout Book")
        remaining_book = create_book("Remaining Cart Book")
        cart = ShoppingCart.objects.create(customer=self.user.customer)
        selected_item = ShoppingCartItem.objects.create(cart=cart, book=selected_book)
        remaining_item = ShoppingCartItem.objects.create(cart=cart, book=remaining_book)

        response = self.client.post(
            self.url,
            {
                "payment_method": "card",
                "cart_item_ids": [selected_item.id],
                "card": {
                    "token": "demo-token",
                    "brand": "Visa",
                    "last4": "4242",
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = ShopOrder.objects.get()
        self.assertEqual(order.lines.count(), 1)
        self.assertEqual(order.lines.first().book, selected_book)
        self.assertFalse(
            ShoppingCartItem.objects.filter(pk=selected_item.pk).exists()
        )
        self.assertTrue(
            ShoppingCartItem.objects.filter(pk=remaining_item.pk).exists()
        )

    def test_checkout_requires_at_least_one_selected_cart_item(self):
        book = create_book("Unchecked Checkout Book")
        cart = ShoppingCart.objects.create(customer=self.user.customer)
        ShoppingCartItem.objects.create(cart=cart, book=book)

        response = self.client.post(
            self.url,
            {
                "payment_method": "card",
                "cart_item_ids": [],
                "card": {
                    "token": "demo-token",
                    "brand": "Visa",
                    "last4": "4242",
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ShopOrder.objects.count(), 0)
