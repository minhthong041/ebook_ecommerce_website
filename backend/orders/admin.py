from django.contrib import admin

from .models import OrderLine, OrderStatus, ShopOrder
from .services import complete_order


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
        "payment_type",
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
    autocomplete_fields = ("customer", "coupon", "payment_type")
    inlines = (OrderLineInline,)
    actions = ("mark_completed",)

    @admin.action(description="Đánh dấu đã hoàn tất và cấp ebook vào thư viện")
    def mark_completed(self, request, queryset):
        completed_count = 0
        for order in queryset.prefetch_related("lines__book", "transactions"):
            complete_order(order)
            completed_count += 1
        self.message_user(
            request,
            f"Đã hoàn tất {completed_count} đơn hàng và cấp sách vào thư viện.",
        )


@admin.register(OrderLine)
class OrderLineAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "book", "price")
    search_fields = ("order__id", "book__title")
    autocomplete_fields = ("order", "book")


@admin.register(OrderStatus)
class OrderStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
