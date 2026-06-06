from django.core.exceptions import ObjectDoesNotExist

from rest_framework import serializers

from catalog.models import Book
from orders.services import get_active_pending_book_ids, get_purchased_book_ids
from promotions.services import get_promotional_pricing

from .models import ShoppingCart, ShoppingCartItem


class CartItemBookSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    promotion_discount_rate = serializers.SerializerMethodField()
    promotion_name = serializers.SerializerMethodField()
    authors = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()
    format_labels = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "price",
            "original_price",
            "promotion_discount_rate",
            "promotion_name",
            "authors",
            "cover_url",
            "format_labels",
        ]

    def get_price(self, obj):
        return str(get_promotional_pricing(obj)["price"])

    def get_original_price(self, obj):
        return str(get_promotional_pricing(obj)["original_price"])

    def get_promotion_discount_rate(self, obj):
        return str(get_promotional_pricing(obj)["promotion_discount_rate"])

    def get_promotion_name(self, obj):
        return get_promotional_pricing(obj)["promotion_name"]

    def get_authors(self, obj):
        return [
            {"id": book_author.author_id, "full_name": book_author.author.full_name}
            for book_author in obj.book_authors.select_related("author").all()
        ]

    def get_cover_url(self, obj):
        stored_url = None
        if isinstance(obj.book_image, dict):
            stored_url = obj.book_image.get("url")
        elif isinstance(obj.book_image, str):
            stored_url = obj.book_image

        if stored_url:
            return self._build_absolute_url(stored_url)

        if not obj.cover_image:
            return None

        return self._build_absolute_url(obj.cover_image.url)

    def get_format_labels(self, obj):
        return [
            ebook_file.format_type.name
            for ebook_file in obj.ebook_files.select_related("format_type").all()
        ]

    def _build_absolute_url(self, url):
        if url.startswith(("http://", "https://")):
            return url

        request = self.context.get("request")
        if request:
            try:
                return request.build_absolute_uri(url)
            except Exception:
                return url
        return url


class CartItemSerializer(serializers.ModelSerializer):
    book_id = serializers.IntegerField(write_only=True)
    book = CartItemBookSerializer(read_only=True)

    class Meta:
        model = ShoppingCartItem
        fields = ["id", "book_id", "book"]

    def validate_book_id(self, value):
        if not Book.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Book not found.")
        if not Book.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError("This book is currently unavailable.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            try:
                customer = request.user.customer
            except ObjectDoesNotExist:
                return attrs
            book_id = attrs["book_id"]
            if book_id in get_purchased_book_ids(customer):
                raise serializers.ValidationError(
                    {"book_id": "Sách này đã có trong thư viện của bạn."}
                )
            if book_id in get_active_pending_book_ids(customer):
                raise serializers.ValidationError(
                    {"book_id": "Sách này đang có đơn chờ thanh toán."}
                )
            cart = ShoppingCart.objects.filter(customer=customer).first()
            if cart and ShoppingCartItem.objects.filter(
                cart=cart, book_id=book_id
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
            get_promotional_pricing(item.book)["price"]
            for item in obj.items.select_related("book").all()
        )
        return str(total)

    def get_item_count(self, obj):
        return obj.items.count()
