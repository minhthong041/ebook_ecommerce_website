from rest_framework import serializers

from payments.models import PaymentType

from .models import ShopOrder
from .services import ORDER_STATUS_PENDING, get_pending_expires_at


class CheckoutSerializer(serializers.Serializer):
    payment_type_id = serializers.IntegerField(required=False)
    payment_method = serializers.ChoiceField(
        choices=["card", "bank_transfer"],
        required=False,
        default="card",
    )
    note = serializers.CharField(required=False, allow_blank=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=50)
    card = serializers.DictField(required=False)

    def validate_payment_type_id(self, value):
        if not PaymentType.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Invalid payment type.")
        return value

    def validate(self, attrs):
        payment_method = attrs.get("payment_method", "card")
        card_payload = attrs.get("card") or {}
        if payment_method == "card":
            token = str(card_payload.get("token", "")).strip()
            last4 = str(card_payload.get("last4", "")).strip()
            if not token:
                raise serializers.ValidationError(
                    {"card": "Missing card payment token."}
                )
            if len(last4) != 4 or not last4.isdigit():
                raise serializers.ValidationError(
                    {"card": "Card last4 must contain exactly 4 digits."}
                )
        return attrs


class OrderLineReadSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    book_id = serializers.IntegerField()
    book_title = serializers.CharField(source="book.title")
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderReadSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="pk")
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField(source="order_status.name")
    created_at = serializers.DateTimeField()
    transaction_id = serializers.SerializerMethodField()
    gateway_reference = serializers.SerializerMethodField()
    payment_type = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_instructions = serializers.SerializerMethodField()
    pending_expires_at = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    def get_transaction_id(self, obj):
        txn = obj.transactions.first()
        return txn.pk if txn else None

    def get_gateway_reference(self, obj):
        txn = obj.transactions.first()
        return txn.gateway_reference if txn else None

    def get_payment_type(self, obj):
        if getattr(obj, "payment_type", None):
            return obj.payment_type.value
        txn = obj.transactions.select_related("payment_type").first()
        return txn.payment_type.value if txn else None

    def get_payment_status(self, obj):
        txn = obj.transactions.select_related("status").first()
        return txn.status.name if txn else None

    def get_payment_instructions(self, obj):
        txn = obj.transactions.first()
        if not txn:
            return None
        return txn.gateway_payload.get("instructions")

    def get_pending_expires_at(self, obj):
        if obj.order_status.name != ORDER_STATUS_PENDING:
            return None
        return get_pending_expires_at(obj)

    def get_items(self, obj):
        lines = obj.lines.select_related("book").all()
        return OrderLineReadSerializer(lines, many=True).data


class StaffOrderReadSerializer(OrderReadSerializer):
    customer = serializers.SerializerMethodField()

    def get_customer(self, obj):
        user = obj.customer.user
        return {
            "id": user.id,
            "customer_id": obj.customer_id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
        }


class StaffOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["pending", "completed", "cancelled", "failed", "refunded"]
    )
