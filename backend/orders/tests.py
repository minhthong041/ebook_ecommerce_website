from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from accounts.models import User
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
