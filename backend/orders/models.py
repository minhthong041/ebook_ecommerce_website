from django.core.validators import MinValueValidator
from django.db import models


class OrderStatus(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "order_statuses"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ShopOrder(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.PROTECT,
        db_column="customer_id",
        related_name="orders",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    coupon = models.ForeignKey(
        "promotions.Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="coupon_id",
        related_name="orders",
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )
    order_status = models.ForeignKey(
        OrderStatus,
        on_delete=models.PROTECT,
        db_column="order_status",
        related_name="orders",
    )
    payment_method = models.ForeignKey(
        "payments.PaymentMethod",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="payment_method_id",
        related_name="orders",
    )

    class Meta:
        db_table = "shop_orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} - {self.customer}"


class OrderLine(models.Model):
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.PROTECT,
        db_column="book_id",
        related_name="order_lines",
    )
    order = models.ForeignKey(
        ShopOrder,
        on_delete=models.CASCADE,
        db_column="order_id",
        related_name="lines",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    class Meta:
        db_table = "order_lines"
        unique_together = ("order", "book")

    def __str__(self):
        return f"{self.order} - {self.book}"
