from django.contrib import admin

from .models import (
    Coupon,
    CouponBook,
    CouponCategory,
    CouponUsage,
    Promotion,
    PromotionBook,
    PromotionCategory,
)


class CouponBookInline(admin.TabularInline):
    model = CouponBook
    extra = 0
    autocomplete_fields = ("book",)


class CouponCategoryInline(admin.TabularInline):
    model = CouponCategory
    extra = 0
    autocomplete_fields = ("category",)


class PromotionBookInline(admin.TabularInline):
    model = PromotionBook
    extra = 0
    autocomplete_fields = ("book",)


class PromotionCategoryInline(admin.TabularInline):
    model = PromotionCategory
    extra = 0
    autocomplete_fields = ("category",)


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "discount_value", "usage_limit", "expiry_date")
    list_filter = ("expiry_date",)
    search_fields = ("code",)
    inlines = (CouponBookInline, CouponCategoryInline)


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "discount_rate", "start_date", "end_date")
    list_filter = ("start_date", "end_date")
    search_fields = ("name",)
    inlines = (PromotionBookInline, PromotionCategoryInline)


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "customer", "coupon", "discount_applied")
    search_fields = ("order__id", "customer__user__username", "coupon__code")
    autocomplete_fields = ("order", "customer", "coupon")


@admin.register(CouponBook)
class CouponBookAdmin(admin.ModelAdmin):
    list_display = ("id", "coupon", "book")
    autocomplete_fields = ("coupon", "book")


@admin.register(CouponCategory)
class CouponCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "coupon", "category")
    autocomplete_fields = ("coupon", "category")


@admin.register(PromotionBook)
class PromotionBookAdmin(admin.ModelAdmin):
    list_display = ("id", "promotion", "book")
    autocomplete_fields = ("promotion", "book")


@admin.register(PromotionCategory)
class PromotionCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "promotion", "category")
    autocomplete_fields = ("promotion", "category")
