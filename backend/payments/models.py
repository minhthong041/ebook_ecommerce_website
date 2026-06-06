from django.core.validators import MinValueValidator
from django.db import models


class PaymentType(models.Model):
    value = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "payment_types"
        ordering = ["value"]

    def __str__(self):
        return self.value


class TransactionStatus(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "transactions_status"
        ordering = ["name"]
        verbose_name_plural = "transaction statuses"

    def __str__(self):
        return self.name


class Transaction(models.Model):
    order = models.ForeignKey(
        "orders.ShopOrder",
        on_delete=models.PROTECT,
        db_column="order_id",
        related_name="transactions",
    )
    payment_type = models.ForeignKey(
        PaymentType,
        on_delete=models.PROTECT,
        db_column="payment_type_id",
        related_name="transactions",
    )
    status = models.ForeignKey(
        TransactionStatus,
        on_delete=models.PROTECT,
        db_column="status_id",
        related_name="transactions",
    )
    amount_processed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    gateway_reference = models.CharField(max_length=255, blank=True)
    gateway_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Transaction #{self.pk} - {self.order}"
