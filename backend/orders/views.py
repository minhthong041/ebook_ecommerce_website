from uuid import uuid4
from decimal import Decimal, InvalidOperation
from urllib.parse import urlencode

from django.conf import settings
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.db import transaction as db_transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentications import JWTAuthentication
from accounts.models import Customer
from accounts.permissions import IsStaffManager, IsSystemAdmin
from cart.models import ShoppingCart
from orders.models import OrderLine, ShopOrder
from payments.models import PaymentType, Transaction, TransactionStatus
from promotions.models import CouponUsage
from promotions.services import calculate_cart_pricing

from .serializers import (
    CheckoutSerializer,
    OrderReadSerializer,
    StaffOrderReadSerializer,
    StaffOrderStatusUpdateSerializer,
)
from .services import (
    ORDER_STATUS_CANCELLED,
    ORDER_STATUS_COMPLETED,
    ORDER_STATUS_FAILED,
    ORDER_STATUS_PENDING,
    ORDER_STATUS_REFUNDED,
    complete_order,
    expire_pending_orders,
    get_active_pending_book_ids,
    get_order_status,
    get_purchased_book_ids,
)


def _get_bank_transfer_info():
    return {
        "bank_code": settings.PAYMENT_BANK_CODE,
        "bank_name": settings.PAYMENT_BANK_NAME,
        "account_number": settings.PAYMENT_BANK_ACCOUNT_NUMBER,
        "account_name": settings.PAYMENT_BANK_ACCOUNT_NAME,
    }


def _get_payment_type(payment_method, payment_type_id=None):
    if payment_type_id:
        return PaymentType.objects.get(pk=payment_type_id)

    payment_type_value = "Bank Transfer" if payment_method == "bank_transfer" else "Card"
    payment_type, _ = PaymentType.objects.get_or_create(value=payment_type_value)
    return payment_type


def _build_vietqr_url(amount, transfer_content):
    bank_code = settings.PAYMENT_BANK_CODE
    account_number = settings.PAYMENT_BANK_ACCOUNT_NUMBER
    template = settings.PAYMENT_BANK_QR_TEMPLATE
    base_url = settings.PAYMENT_BANK_QR_BASE_URL.rstrip("/")
    qr_path = f"{base_url}/{bank_code}-{account_number}-{template}.png"
    amount_value = int(Decimal(amount or 0))
    query = {
        "amount": amount_value,
        "addInfo": transfer_content,
        "accountName": settings.PAYMENT_BANK_ACCOUNT_NAME,
    }
    return f"{qr_path}?{urlencode(query)}"


def _build_bank_transfer_instructions(order_id, amount):
    transfer_content = f"READIFY-{order_id}" if order_id else "READIFY-CHECKOUT"
    return {
        **_get_bank_transfer_info(),
        "amount": str(amount),
        "currency": "VND",
        "transfer_content": transfer_content,
        "qr_url": _build_vietqr_url(amount, transfer_content),
        "note": "Đơn hàng sẽ được kích hoạt sau khi quản trị viên xác nhận khoản chuyển khoản.",
    }


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def order_list(request):
    customer, _ = Customer.objects.get_or_create(user=request.user)
    expire_pending_orders(customer=customer)
    status_filter = request.query_params.get("status", "").strip().lower()
    orders = (
        ShopOrder.objects.filter(customer=customer)
        .select_related("order_status", "payment_type")
        .prefetch_related("transactions__payment_type", "transactions__status", "lines__book")
        .order_by("-created_at")
    )
    valid_order_statuses = {
        "pending",
        "completed",
        "cancelled",
        "failed",
        "refunded",
    }
    if status_filter and status_filter != "all":
        if status_filter not in valid_order_statuses:
            return Response(
                {"detail": "Invalid order status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        orders = orders.filter(order_status__name=status_filter)

    serializer = OrderReadSerializer(orders, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


def _staff_order_queryset():
    return (
        ShopOrder.objects.select_related(
            "customer__user",
            "order_status",
            "payment_type",
        )
        .prefetch_related("transactions__payment_type", "transactions__status", "lines__book")
        .order_by("-created_at")
    )


def _decimal_to_string(value):
    return str(value or Decimal("0"))


def _month_start(dt):
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _add_months(dt, months):
    month = dt.month - 1 + months
    year = dt.year + month // 12
    month = month % 12 + 1
    return dt.replace(year=year, month=month)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsStaffManager])
def staff_order_list(request):
    expire_pending_orders()
    status_filter = request.query_params.get("status", "").strip().lower()
    payment_type = request.query_params.get("payment_type", "").strip()
    query = request.query_params.get("q", "").strip()
    orders = _staff_order_queryset()

    valid_order_statuses = {
        ORDER_STATUS_PENDING,
        ORDER_STATUS_COMPLETED,
        ORDER_STATUS_CANCELLED,
        ORDER_STATUS_FAILED,
        ORDER_STATUS_REFUNDED,
    }
    if status_filter and status_filter != "all":
        if status_filter not in valid_order_statuses:
            return Response(
                {"detail": "Invalid order status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        orders = orders.filter(order_status__name=status_filter)

    if payment_type and payment_type != "all":
        orders = orders.filter(payment_type__value__iexact=payment_type)

    if query:
        search_filter = (
            Q(customer__user__username__icontains=query)
            | Q(customer__user__full_name__icontains=query)
            | Q(customer__user__email__icontains=query)
            | Q(lines__book__title__icontains=query)
            | Q(transactions__gateway_reference__icontains=query)
        )
        if query.isdigit():
            search_filter |= Q(id=int(query))
        orders = orders.filter(search_filter).distinct()

    serializer = StaffOrderReadSerializer(orders, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsStaffManager])
def staff_order_detail(request, pk):
    serializer = StaffOrderStatusUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    next_status = serializer.validated_data["status"]

    try:
        order = _staff_order_queryset().get(pk=pk)
    except ShopOrder.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    with db_transaction.atomic():
        if next_status == ORDER_STATUS_COMPLETED:
            order = complete_order(order)
        else:
            order.order_status = get_order_status(next_status)
            order.save(update_fields=["order_status"])
            transaction_status_map = {
                ORDER_STATUS_CANCELLED: "Failed",
                ORDER_STATUS_FAILED: "Failed",
                ORDER_STATUS_REFUNDED: "Refunded",
                ORDER_STATUS_PENDING: "Pending",
            }
            transaction_status_name = transaction_status_map.get(next_status)
            if transaction_status_name:
                transaction_status, _ = TransactionStatus.objects.get_or_create(
                    name=transaction_status_name
                )
                order.transactions.update(status=transaction_status)

    order = _staff_order_queryset().get(pk=order.pk)
    response_serializer = StaffOrderReadSerializer(order, context={"request": request})
    return Response(response_serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsSystemAdmin])
def staff_dashboard_stats(request):
    expire_pending_orders()
    now = timezone.localtime()
    current_month_start = _month_start(now)
    next_month_start = _add_months(current_month_start, 1)
    previous_month_start = _add_months(current_month_start, -1)
    series_start = _add_months(current_month_start, -5)

    completed_orders = ShopOrder.objects.filter(
        order_status__name=ORDER_STATUS_COMPLETED
    )
    current_month_orders = completed_orders.filter(
        created_at__gte=current_month_start,
        created_at__lt=next_month_start,
    )
    previous_month_orders = completed_orders.filter(
        created_at__gte=previous_month_start,
        created_at__lt=current_month_start,
    )

    current_revenue = current_month_orders.aggregate(total=Sum("total_price"))["total"] or Decimal("0")
    previous_revenue = previous_month_orders.aggregate(total=Sum("total_price"))["total"] or Decimal("0")
    revenue_delta = current_revenue - previous_revenue

    raw_monthly_revenue = {
        item["month"].strftime("%Y-%m"): item["revenue"] or Decimal("0")
        for item in completed_orders.filter(created_at__gte=series_start)
        .annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(revenue=Sum("total_price"), order_count=Count("id"))
        .order_by("month")
    }
    monthly_revenue = []
    for index in range(6):
        month = _add_months(series_start, index)
        key = month.strftime("%Y-%m")
        monthly_revenue.append(
            {
                "month": key,
                "label": month.strftime("%m/%Y"),
                "revenue": _decimal_to_string(raw_monthly_revenue.get(key, Decimal("0"))),
            }
        )

    best_selling_books = (
        OrderLine.objects.filter(order__order_status__name=ORDER_STATUS_COMPLETED)
        .values("book_id", "book__title")
        .annotate(
            sold_count=Count("id"),
            revenue=Sum("price"),
        )
        .order_by("-sold_count", "-revenue")[:5]
    )

    response = {
        "current_month": {
            "label": current_month_start.strftime("%m/%Y"),
            "revenue": _decimal_to_string(current_revenue),
            "order_count": current_month_orders.count(),
        },
        "previous_month": {
            "label": previous_month_start.strftime("%m/%Y"),
            "revenue": _decimal_to_string(previous_revenue),
            "order_count": previous_month_orders.count(),
        },
        "revenue_delta": _decimal_to_string(revenue_delta),
        "total_completed_revenue": _decimal_to_string(
            completed_orders.aggregate(total=Sum("total_price"))["total"] or Decimal("0")
        ),
        "monthly_revenue": monthly_revenue,
        "best_selling_books": [
            {
                "book_id": item["book_id"],
                "title": item["book__title"],
                "sold_count": item["sold_count"],
                "revenue": _decimal_to_string(item["revenue"]),
            }
            for item in best_selling_books
        ],
    }
    return Response(response, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def bank_transfer_info(request):
    amount_param = request.query_params.get("amount", "0")
    try:
        amount = Decimal(str(amount_param))
    except (InvalidOperation, TypeError):
        amount = Decimal("0")

    if amount < 0:
        amount = Decimal("0")

    instructions = _build_bank_transfer_instructions(None, amount)
    return Response(instructions, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def checkout(request):
    serializer = CheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payment_type_id = serializer.validated_data.get("payment_type_id")
    payment_method = serializer.validated_data.get("payment_method", "card")
    coupon_code = serializer.validated_data.get("coupon_code", "").strip()
    card_payload = serializer.validated_data.get("card") or {}

    customer, _ = Customer.objects.get_or_create(user=request.user)
    expire_pending_orders(customer=customer)

    cart = ShoppingCart.objects.filter(customer=customer).first()
    if not cart or not cart.items.exists():
        return Response(
            {"detail": "Your cart is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart_items_queryset = cart.items.select_related("book").all()
    selected_cart_item_ids = serializer.validated_data.get("cart_item_ids", None)
    if selected_cart_item_ids is not None:
        unique_selected_ids = set(selected_cart_item_ids)
        if not unique_selected_ids:
            return Response(
                {"detail": "Vui lòng chọn ít nhất một sách để thanh toán."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart_items_queryset = cart_items_queryset.filter(id__in=unique_selected_ids)

    cart_items = list(cart_items_queryset)
    if selected_cart_item_ids is not None and len(cart_items) != len(unique_selected_ids):
        return Response(
            {"detail": "Một số sách được chọn không còn trong giỏ hàng."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    purchased_book_ids = get_purchased_book_ids(customer)
    pending_book_ids = get_active_pending_book_ids(customer)
    purchased_cart_items = [
        item.book.title for item in cart_items if item.book_id in purchased_book_ids
    ]
    pending_cart_items = [
        item.book.title for item in cart_items if item.book_id in pending_book_ids
    ]
    if purchased_cart_items:
        return Response(
            {
                "detail": (
                    "Một số sách đã có trong thư viện của bạn: "
                    + ", ".join(purchased_cart_items)
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    if pending_cart_items:
        return Response(
            {
                "detail": (
                    "Một số sách đang có đơn chờ thanh toán: "
                    + ", ".join(pending_cart_items)
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    pricing = calculate_cart_pricing(cart_items, coupon_code=coupon_code)
    checked_out_cart_item_ids = [item.pk for item in cart_items]
    total_price = pricing["total_price"]

    with db_transaction.atomic():
        order_status_pending = get_order_status(ORDER_STATUS_PENDING)
        order_status_completed = get_order_status(ORDER_STATUS_COMPLETED)
        transaction_status_success, _ = TransactionStatus.objects.get_or_create(
            name="Success"
        )
        transaction_status_pending, _ = TransactionStatus.objects.get_or_create(
            name="Pending"
        )
        payment_type = _get_payment_type(payment_method, payment_type_id)

        shop_order = ShopOrder.objects.create(
            customer=customer,
            coupon=pricing["coupon"],
            total_price=total_price,
            discount_amount=pricing["discount_amount"],
            order_status=order_status_pending,
            payment_type=payment_type,
        )

        for line_item in pricing["line_items"]:
            OrderLine.objects.create(
                order=shop_order,
                book=line_item["book"],
                price=line_item["price"],
            )

        if pricing["coupon"]:
            CouponUsage.objects.create(
                order=shop_order,
                customer=customer,
                coupon=pricing["coupon"],
                discount_applied=pricing["coupon_discount"],
            )

        if payment_method == "bank_transfer":
            gateway_ref = f"BANK-{uuid4().hex[:12].upper()}"
            Transaction.objects.create(
                order=shop_order,
                payment_type=payment_type,
                status=transaction_status_pending,
                amount_processed=total_price,
                gateway_reference=gateway_ref,
                gateway_payload={
                    "provider": "manual_bank_transfer",
                    "method": "bank_transfer",
                    "instructions": _build_bank_transfer_instructions(
                        shop_order.pk,
                        total_price,
                    ),
                },
            )
            cart.items.filter(pk__in=checked_out_cart_item_ids).delete()
            result = OrderReadSerializer(shop_order, context={"request": request}).data
            return Response(result, status=status.HTTP_201_CREATED)

        gateway_ref = f"CARD-{uuid4().hex[:12].upper()}"
        Transaction.objects.create(
            order=shop_order,
            payment_type=payment_type,
            status=transaction_status_success,
            amount_processed=total_price,
            gateway_reference=gateway_ref,
            gateway_payload={
                "provider": "demo_card_gateway",
                "method": "card",
                "card": {
                    "token": card_payload.get("token"),
                    "brand": card_payload.get("brand", "Card"),
                    "last4": card_payload.get("last4"),
                    "holder_name": card_payload.get("holder_name", ""),
                },
                "mock": True,
            },
        )

        cart.items.filter(pk__in=checked_out_cart_item_ids).delete()

        shop_order.order_status = order_status_completed
        shop_order.save(update_fields=["order_status"])
        complete_order(shop_order)

    result = OrderReadSerializer(shop_order, context={"request": request}).data
    return Response(result, status=status.HTTP_201_CREATED)
