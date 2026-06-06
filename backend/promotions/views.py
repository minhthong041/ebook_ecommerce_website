from rest_framework import status, viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentications import JWTAuthentication
from accounts.models import Customer
from accounts.permissions import IsSystemAdmin
from cart.models import ShoppingCart

from .models import Coupon, Promotion
from .serializers import (
    CouponManagementSerializer,
    CouponValidateSerializer,
    PromotionManagementSerializer,
)


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
    cart_items = []
    if cart:
        cart_items = list(
            cart.items.select_related("book").prefetch_related(
                "book__book_categories",
            )
        )

    serializer = CouponValidateSerializer(
        data=request.data,
        context={"cart_items": cart_items},
    )
    serializer.is_valid(raise_exception=True)
    pricing = serializer.validated_data["pricing"]
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
