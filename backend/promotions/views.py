from rest_framework import status, viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentications import JWTAuthentication
from accounts.models import Customer
from accounts.permissions import IsSystemAdmin
from cart.models import ShoppingCart, ShoppingCartItem

from .models import Coupon, Promotion
from .serializers import (
    CouponManagementSerializer,
    CouponValidateSerializer,
    PromotionManagementSerializer,
)
from .services import calculate_cart_pricing


class AdminPromotionViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSystemAdmin]
    serializer_class = PromotionManagementSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["start_date", "end_date", "discount_rate", "name"]
    ordering = ["-start_date", "name"]

    def get_queryset(self):
        return Promotion.objects.prefetch_related("books", "categories")


class AdminCouponViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSystemAdmin]
    serializer_class = CouponManagementSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["code"]
    ordering_fields = ["code", "expiry_date", "discount_value"]
    ordering = ["code"]

    def get_queryset(self):
        return Coupon.objects.prefetch_related(
            "books",
            "categories",
            "coupon_usages",
        )


@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def validate_coupon(request):
    customer, _ = Customer.objects.get_or_create(user=request.user)
    cart = ShoppingCart.objects.filter(customer=customer).first()
    serializer = CouponValidateSerializer(
        data=request.data,
    )
    serializer.is_valid(raise_exception=True)

    cart_items_queryset = ShoppingCartItem.objects.none()
    if cart:
        cart_items_queryset = cart.items.select_related("book").prefetch_related(
            "book__book_categories",
        )

    selected_cart_item_ids = serializer.validated_data.get("cart_item_ids", None)
    if selected_cart_item_ids is not None:
        unique_selected_ids = set(selected_cart_item_ids)
        if not unique_selected_ids:
            return Response(
                {"cart_item_ids": ["Vui lòng chọn ít nhất một sách để áp dụng mã."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart_items_queryset = cart_items_queryset.filter(id__in=unique_selected_ids)

    cart_items = list(cart_items_queryset)
    if selected_cart_item_ids is not None and len(cart_items) != len(unique_selected_ids):
        return Response(
            {"cart_item_ids": ["Một số sách được chọn không còn trong giỏ hàng."]},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not cart_items:
        return Response(
            {"coupon_code": ["Giỏ hàng đang trống."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    pricing = calculate_cart_pricing(
        cart_items,
        coupon_code=serializer.validated_data["coupon_code"],
    )
    coupon = pricing["coupon"]

    return Response(
        {
            "code": coupon.code,
            "discount_amount": str(pricing["coupon_discount"]),
            "promotion_discount": str(pricing["promotion_discount"]),
            "subtotal": str(pricing["promotion_subtotal"]),
            "total_price": str(pricing["total_price"]),
        },
        status=status.HTTP_200_OK,
    )
