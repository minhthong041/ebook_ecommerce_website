from django.core.validators import MinValueValidator
from django.db import models


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    expiry_date = models.DateTimeField()

    books = models.ManyToManyField(
        "catalog.Book",
        through="CouponBook",
        related_name="coupons",
    )
    categories = models.ManyToManyField(
        "catalog.Category",
        through="CouponCategory",
        related_name="coupons",
    )

    class Meta:
        db_table = "coupons"
        ordering = ["code"]

    def __str__(self):
        return self.code


class Promotion(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    discount_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    start_date = models.DateField()
    end_date = models.DateField()

    books = models.ManyToManyField(
        "catalog.Book",
        through="PromotionBook",
        related_name="promotions",
    )
    categories = models.ManyToManyField(
        "catalog.Category",
        through="PromotionCategory",
        related_name="promotions",
    )

    class Meta:
        db_table = "promotions"
        ordering = ["-start_date", "name"]

    def __str__(self):
        return self.name


class CouponBook(models.Model):
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        db_column="coupon_id",
        related_name="coupon_books",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="coupon_books",
    )

    class Meta:
        db_table = "coupon_books"
        unique_together = ("coupon", "book")

    def __str__(self):
        return f"{self.coupon} - {self.book}"


class CouponCategory(models.Model):
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        db_column="coupon_id",
        related_name="coupon_categories",
    )
    category = models.ForeignKey(
        "catalog.Category",
        on_delete=models.CASCADE,
        db_column="category_id",
        related_name="coupon_categories",
    )

    class Meta:
        db_table = "coupon_categories"
        verbose_name_plural = "coupon categories"
        unique_together = ("coupon", "category")

    def __str__(self):
        return f"{self.coupon} - {self.category}"


class PromotionBook(models.Model):
    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.CASCADE,
        db_column="promotion_id",
        related_name="promotion_books",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="promotion_books",
    )

    class Meta:
        db_table = "promotion_books"
        unique_together = ("promotion", "book")

    def __str__(self):
        return f"{self.promotion} - {self.book}"


class PromotionCategory(models.Model):
    promotion = models.ForeignKey(
        Promotion,
        on_delete=models.CASCADE,
        db_column="promotion_id",
        related_name="promotion_categories",
    )
    category = models.ForeignKey(
        "catalog.Category",
        on_delete=models.CASCADE,
        db_column="category_id",
        related_name="promotion_categories",
    )

    class Meta:
        db_table = "promotion_categories"
        verbose_name_plural = "promotion categories"
        unique_together = ("promotion", "category")

    def __str__(self):
        return f"{self.promotion} - {self.category}"


class CouponUsage(models.Model):
    order = models.ForeignKey(
        "orders.ShopOrder",
        on_delete=models.CASCADE,
        db_column="order_id",
        related_name="coupon_usages",
    )
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.PROTECT,
        db_column="customer_id",
        related_name="coupon_usages",
    )
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.PROTECT,
        db_column="coupon_id",
        related_name="coupon_usages",
    )
    discount_applied = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    class Meta:
        db_table = "coupon_usages"
        unique_together = ("order", "coupon")

    def __str__(self):
        return f"{self.coupon} used on {self.order}"
