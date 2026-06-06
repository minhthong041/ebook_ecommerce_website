from datetime import timedelta

from django.utils import timezone

from library.models import UserLibrary, UserLibraryItem
from payments.models import TransactionStatus

from .models import OrderStatus, ShopOrder


ORDER_STATUS_PENDING = "pending"
ORDER_STATUS_COMPLETED = "completed"
ORDER_STATUS_CANCELLED = "cancelled"
ORDER_STATUS_FAILED = "failed"
ORDER_STATUS_REFUNDED = "refunded"
PENDING_ORDER_TTL_MINUTES = 30


def get_order_status(name):
    status, _ = OrderStatus.objects.get_or_create(name=name)
    return status


def get_pending_expires_at(order):
    return order.created_at + timedelta(minutes=PENDING_ORDER_TTL_MINUTES)


def expire_pending_orders(customer=None):
    cutoff = timezone.now() - timedelta(minutes=PENDING_ORDER_TTL_MINUTES)
    queryset = ShopOrder.objects.filter(
        order_status__name=ORDER_STATUS_PENDING,
        created_at__lte=cutoff,
    )
    if customer is not None:
        queryset = queryset.filter(customer=customer)

    expired_orders = list(queryset)
    if not expired_orders:
        return []

    cancelled_status = get_order_status(ORDER_STATUS_CANCELLED)
    failed_transaction_status, _ = TransactionStatus.objects.get_or_create(
        name="Failed"
    )
    expired_ids = [order.pk for order in expired_orders]
    ShopOrder.objects.filter(pk__in=expired_ids).update(
        order_status=cancelled_status
    )
    for order in expired_orders:
        order.transactions.filter(status__name="Pending").update(
            status=failed_transaction_status
        )
    return expired_orders


def get_active_pending_book_ids(customer):
    expire_pending_orders(customer=customer)
    return set(
        ShopOrder.objects.filter(
            customer=customer,
            order_status__name=ORDER_STATUS_PENDING,
        )
        .values_list("lines__book_id", flat=True)
        .distinct()
    )


def get_purchased_book_ids(customer):
    return set(
        UserLibraryItem.objects.filter(library__customer=customer)
        .values_list("book_id", flat=True)
        .distinct()
    )


def grant_order_books_to_library(order):
    library, _ = UserLibrary.objects.get_or_create(
        customer=order.customer,
        name="My Library",
    )
    for line in order.lines.select_related("book").all():
        UserLibraryItem.objects.get_or_create(
            library=library,
            book=line.book,
        )


def complete_order(order):
    completed_status = get_order_status(ORDER_STATUS_COMPLETED)
    success_transaction_status, _ = TransactionStatus.objects.get_or_create(
        name="Success"
    )
    order.order_status = completed_status
    order.save(update_fields=["order_status"])
    order.transactions.exclude(status=success_transaction_status).update(
        status=success_transaction_status
    )
    grant_order_books_to_library(order)
    return order
