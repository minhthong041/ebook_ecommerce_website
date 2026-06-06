from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register(
    r"admin/promotions",
    views.AdminPromotionViewSet,
    basename="admin-promotion",
)
router.register(
    r"admin/coupons",
    views.AdminCouponViewSet,
    basename="admin-coupon",
)

urlpatterns = [
    path("coupons/validate/", views.validate_coupon, name="coupon-validate"),
    path("", include(router.urls)),
]
