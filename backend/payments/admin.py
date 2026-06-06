from django.contrib import admin

from .models import PaymentType, Transaction, TransactionStatus


@admin.register(PaymentType)
class PaymentTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "value")
    search_fields = ("value",)


@admin.register(TransactionStatus)
class TransactionStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "payment_type",
        "status",
        "amount_processed",
        "created_at",
    )
    list_filter = ("payment_type", "status", "created_at")
    search_fields = ("order__id", "gateway_reference")
    autocomplete_fields = ("order", "payment_type", "status")
