from django.utils import timezone
from rest_framework import serializers

from catalog.models import Book, Category

from .models import Coupon, Promotion
from .services import calculate_cart_pricing


class PromotionManagementSerializer(serializers.ModelSerializer):
    book_ids = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        source="books",
        many=True,
        required=False,
    )
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="categories",
        many=True,
        required=False,
    )
    book_count = serializers.IntegerField(source="books.count", read_only=True)
    category_count = serializers.IntegerField(source="categories.count", read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Promotion
        fields = [
            "id",
            "name",
            "description",
            "discount_rate",
            "start_date",
            "end_date",
            "book_ids",
            "category_ids",
            "book_count",
            "category_count",
            "is_active",
        ]

    def validate_discount_rate(self, value):
        if value > 100:
            raise serializers.ValidationError("Discount rate cannot exceed 100%.")
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be greater than or equal to start date."}
            )
        return attrs

    def get_is_active(self, obj):
        today = timezone.localdate()
        return obj.start_date <= today <= obj.end_date

    def create(self, validated_data):
        books = validated_data.pop("books", [])
        categories = validated_data.pop("categories", [])
        promotion = Promotion.objects.create(**validated_data)
        promotion.books.set(books)
        promotion.categories.set(categories)
        return promotion

    def update(self, instance, validated_data):
        books = validated_data.pop("books", None)
        categories = validated_data.pop("categories", None)
        for field_name, value in validated_data.items():
            setattr(instance, field_name, value)
        instance.save()
        if books is not None:
            instance.books.set(books)
        if categories is not None:
            instance.categories.set(categories)
        return instance


class CouponManagementSerializer(serializers.ModelSerializer):
    book_ids = serializers.PrimaryKeyRelatedField(
        queryset=Book.objects.all(),
        source="books",
        many=True,
        required=False,
    )
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="categories",
        many=True,
        required=False,
    )
    usage_count = serializers.IntegerField(source="coupon_usages.count", read_only=True)
    book_count = serializers.IntegerField(source="books.count", read_only=True)
    category_count = serializers.IntegerField(source="categories.count", read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discount_value",
            "usage_limit",
            "expiry_date",
            "book_ids",
            "category_ids",
            "usage_count",
            "book_count",
            "category_count",
            "is_active",
        ]

    def validate_code(self, value):
        return value.strip().upper()

    def get_is_active(self, obj):
        if obj.expiry_date < timezone.now():
            return False
        if obj.usage_limit is None:
            return True
        return obj.coupon_usages.count() < obj.usage_limit

    def create(self, validated_data):
        books = validated_data.pop("books", [])
        categories = validated_data.pop("categories", [])
        coupon = Coupon.objects.create(**validated_data)
        coupon.books.set(books)
        coupon.categories.set(categories)
        return coupon

    def update(self, instance, validated_data):
        books = validated_data.pop("books", None)
        categories = validated_data.pop("categories", None)
        for field_name, value in validated_data.items():
            setattr(instance, field_name, value)
        instance.save()
        if books is not None:
            instance.books.set(books)
        if categories is not None:
            instance.categories.set(categories)
        return instance


class CouponValidateSerializer(serializers.Serializer):
    coupon_code = serializers.CharField(max_length=50)

    def validate_coupon_code(self, value):
        return value.strip().upper()

    def validate(self, attrs):
        cart_items = self.context.get("cart_items") or []
        if not cart_items:
            raise serializers.ValidationError({"coupon_code": "Giỏ hàng đang trống."})
        attrs["pricing"] = calculate_cart_pricing(
            cart_items,
            coupon_code=attrs["coupon_code"],
        )
        return attrs
