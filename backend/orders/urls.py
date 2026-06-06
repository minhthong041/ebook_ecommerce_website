from django.urls import path

from . import views

urlpatterns = [
    path(
        "payment/bank-transfer-info/",
        views.bank_transfer_info,
        name="bank-transfer-info",
    ),
    path("orders/", views.order_list, name="order-list"),
    path("staff/dashboard/", views.staff_dashboard_stats, name="staff-dashboard-stats"),
    path("staff/orders/", views.staff_order_list, name="staff-order-list"),
    path("staff/orders/<int:pk>/", views.staff_order_detail, name="staff-order-detail"),
    path("checkout/", views.checkout, name="checkout"),
]
