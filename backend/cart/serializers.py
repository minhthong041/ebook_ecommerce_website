from django.core.exceptions import ObjectDoesNotExist

from rest_framework import serializers

from .models import ShoppingCart, ShoppingCartItem


class CartItemBookSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class CartItemSerializer(serializers.ModelSerializer):
    book_id = serializers.IntegerField(write_only=True)
    book = CartItemBookSerializer(read_only=True)

    class Meta:
        model = ShoppingCartItem
        fields = ["id", "book_id", "book"]

    def validate_book_id(self, value):
        from catalog.models import Book
        if not Book.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Book not found.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            try:
                customer = request.user.customer
            except ObjectDoesNotExist:
                return attrs
            cart = ShoppingCart.objects.filter(customer=customer).first()
            if cart and ShoppingCartItem.objects.filter(
                cart=cart, book_id=attrs["book_id"]
            ).exists():
                raise serializers.ValidationError(
                    {"book_id": "This book is already in your cart."}
                )
        return attrs


class CartSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    items = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    def get_items(self, obj):
        items = obj.items.select_related("book").all()
        return CartItemSerializer(items, many=True, context=self.context).data

    def get_total_price(self, obj):
        total = sum(
            item.book.price for item in obj.items.select_related("book").all()
        )
        return str(total)

    def get_item_count(self, obj):
        return obj.items.count()
