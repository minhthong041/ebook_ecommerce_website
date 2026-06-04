from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"cart/items", views.CartItemViewSet, basename="cart-item")

urlpatterns = [
    path("cart/", views.cart_summary, name="cart-summary"),
    path("", include(router.urls)),
]
