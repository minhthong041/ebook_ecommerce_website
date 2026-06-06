from django.db import IntegrityError

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.authentications import JWTAuthentication
from accounts.models import Customer

from .models import ShoppingCart, ShoppingCartItem
from .serializers import CartItemSerializer, CartSerializer


def _get_or_create_cart(customer):
    cart = ShoppingCart.objects.filter(customer=customer).first()
    if not cart:
        cart = ShoppingCart.objects.create(customer=customer)
    return cart


class CartItemViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        customer, _ = Customer.objects.get_or_create(user=self.request.user)
        cart = ShoppingCart.objects.filter(customer=customer).first()
        if not cart:
            return ShoppingCartItem.objects.none()
        return cart.items.select_related("book").prefetch_related(
            "book__book_authors__author",
            "book__ebook_files__format_type",
        )

    def perform_create(self, serializer):
        customer, _ = Customer.objects.get_or_create(user=self.request.user)
        cart = _get_or_create_cart(customer)
        try:
            serializer.save(cart=cart)
        except IntegrityError:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"book_id": "This book is already in your cart."})


@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def cart_summary(request):
    customer, _ = Customer.objects.get_or_create(user=request.user)
    cart = _get_or_create_cart(customer)
    serializer = CartSerializer(cart, context={"request": request})
    return Response(serializer.data)
