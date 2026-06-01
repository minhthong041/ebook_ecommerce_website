from django.db import models


class ShoppingCart(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="shopping_carts",
    )

    class Meta:
        db_table = "shopping_carts"

    def __str__(self):
        return f"Cart #{self.pk} - {self.customer}"


class ShoppingCartItem(models.Model):
    cart = models.ForeignKey(
        ShoppingCart,
        on_delete=models.CASCADE,
        db_column="cart_id",
        related_name="items",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="shopping_cart_items",
    )

    class Meta:
        db_table = "shopping_cart_items"
        unique_together = ("cart", "book")

    def __str__(self):
        return f"{self.cart} - {self.book}"
