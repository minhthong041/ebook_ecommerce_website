from uuid import uuid4

from django.db import transaction as db_transaction

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import Customer
from cart.models import ShoppingCart, ShoppingCartItem
from library.models import UserLibrary, UserLibraryItem
from orders.models import OrderLine, OrderStatus, ShopOrder
from payments.models import PaymentType, Transaction, TransactionStatus

from .serializers import CheckoutSerializer, OrderReadSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payment_type_id = serializer.validated_data["payment_type_id"]

    customer, _ = Customer.objects.get_or_create(user=request.user)

    cart = ShoppingCart.objects.filter(customer=customer).first()
    if not cart or not cart.items.exists():
        return Response(
            {"detail": "Your cart is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_items = list(cart.items.select_related("book").all())
    total_price = sum(item.book.price for item in cart_items)

    with db_transaction.atomic():
        order_status_pending = OrderStatus.objects.get(name="Pending")
        order_status_paid = OrderStatus.objects.get(name="Paid")
        transaction_status_success = TransactionStatus.objects.get(name="Success")
        payment_type = PaymentType.objects.get(pk=payment_type_id)

        shop_order = ShopOrder.objects.create(
            customer=customer,
            total_price=total_price,
            discount_amount=0,
            order_status=order_status_pending,
        )

        for cart_item in cart_items:
            OrderLine.objects.create(
                order=shop_order,
                book=cart_item.book,
                price=cart_item.book.price,
            )

        gateway_ref = f"MOCK-{uuid4().hex[:12].upper()}"
        transaction = Transaction.objects.create(
            order=shop_order,
            payment_type=payment_type,
            status=transaction_status_success,
            amount_processed=total_price,
            gateway_reference=gateway_ref,
            gateway_payload={"mock": True, "method": "mock_success"},
        )

        library, _ = UserLibrary.objects.get_or_create(
            customer=customer,
            name="My Library",
        )
        for cart_item in cart_items:
            UserLibraryItem.objects.get_or_create(
                library=library,
                book=cart_item.book,
            )

        cart.items.all().delete()

        shop_order.order_status = order_status_paid
        shop_order.save(update_fields=["order_status"])

    result = OrderReadSerializer(shop_order, context={"request": request}).data
    return Response(result, status=status.HTTP_201_CREATED)
