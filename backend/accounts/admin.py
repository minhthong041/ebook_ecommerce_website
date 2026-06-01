from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AppPermission, Customer, Role, RolePermission, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = (
        "id",
        "username",
        "email",
        "full_name",
        "role",
        "is_staff",
        "is_active",
    )
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email", "full_name", "phone_number")

    fieldsets = UserAdmin.fieldsets + (
        (
            "Ebook account info",
            {
                "fields": ("full_name", "role", "dob", "phone_number"),
            },
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "Ebook account info",
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "dob", "phone_number"),
            },
        ),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(AppPermission)
class AppPermissionAdmin(admin.ModelAdmin):
    list_display = ("id", "module", "code")
    search_fields = ("module", "code")


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("id", "role", "permission")
    list_filter = ("role",)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("user", "loyalty_points")
    search_fields = ("user__username", "user__email", "user__full_name")
