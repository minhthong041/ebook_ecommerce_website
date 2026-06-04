from rest_framework import serializers

from payments.models import PaymentType

from .models import ShopOrder


class CheckoutSerializer(serializers.Serializer):
    payment_type_id = serializers.IntegerField()

    def validate_payment_type_id(self, value):
        if not PaymentType.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Invalid payment type.")
        return value


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
    items = serializers.SerializerMethodField()

    def get_transaction_id(self, obj):
        txn = obj.transactions.first()
        return txn.pk if txn else None

    def get_gateway_reference(self, obj):
        txn = obj.transactions.first()
        return txn.gateway_reference if txn else None

    def get_items(self, obj):
        lines = obj.lines.select_related("book").all()
        return OrderLineReadSerializer(lines, many=True).data
