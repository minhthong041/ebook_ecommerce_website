from django.contrib import admin

from .models import ShoppingCart, ShoppingCartItem


class ShoppingCartItemInline(admin.TabularInline):
    model = ShoppingCartItem
    extra = 0
    autocomplete_fields = ("book",)


@admin.register(ShoppingCart)
class ShoppingCartAdmin(admin.ModelAdmin):
    list_display = ("id", "customer")
    search_fields = (
        "customer__user__username",
        "customer__user__email",
        "customer__user__full_name",
    )
    autocomplete_fields = ("customer",)
    inlines = (ShoppingCartItemInline,)


@admin.register(ShoppingCartItem)
class ShoppingCartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "book")
    search_fields = ("book__title", "cart__customer__user__username")
    autocomplete_fields = ("cart", "book")
