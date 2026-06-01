from django.contrib import admin

from .models import OrderLine, OrderStatus, ShopOrder


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0
    autocomplete_fields = ("book",)


@admin.register(ShopOrder)
class ShopOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer",
        "order_status",
        "total_price",
        "discount_amount",
        "created_at",
    )
    list_filter = ("order_status", "created_at")
    search_fields = (
        "customer__user__username",
        "customer__user__email",
        "customer__user__full_name",
    )
    autocomplete_fields = ("customer", "coupon", "payment_method")
    inlines = (OrderLineInline,)


@admin.register(OrderLine)
class OrderLineAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "book", "price")
    search_fields = ("order__id", "book__title")
    autocomplete_fields = ("order", "book")


@admin.register(OrderStatus)
class OrderStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
