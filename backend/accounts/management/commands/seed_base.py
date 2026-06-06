from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import AppPermission, Role, RolePermission
from catalog.models import (
    Category,
    FormatType,
)
from orders.models import OrderStatus, ShopOrder
from payments.models import PaymentType, TransactionStatus
from promotions.models import Coupon


class Command(BaseCommand):
    help = "Seed base reference data for local development."

    def handle(self, *args, **options):
        self.seed_roles_and_permissions()
        self.seed_order_statuses()
        self.seed_payment_data()
        self.seed_catalog_reference_data()
        self.seed_sample_coupon()
        self.stdout.write(self.style.SUCCESS("Base seed data is ready."))

    def seed_roles_and_permissions(self):
        legacy_content_manager = Role.objects.filter(name="Content Manager").first()
        employee_role, _ = Role.objects.get_or_create(name="Employee")

        if legacy_content_manager and legacy_content_manager != employee_role:
            legacy_content_manager.users.update(role=employee_role)
            for role_permission in legacy_content_manager.role_permissions.select_related("permission"):
                RolePermission.objects.get_or_create(
                    role=employee_role,
                    permission=role_permission.permission,
                )
            legacy_content_manager.delete()

        roles = {
            "Admin": [
                ("accounts", "manage_users", "Manage users, customers, roles, and permissions."),
                ("catalog", "manage_catalog", "Manage books, authors, publishers, and categories."),
                ("orders", "manage_orders", "Manage orders and order statuses."),
                ("payments", "manage_payments", "Manage payment types and transactions."),
                ("promotions", "manage_promotions", "Manage coupons and promotions."),
                ("library", "manage_library", "Manage customer libraries and reading data."),
            ],
            "Employee": [
                ("catalog", "manage_catalog", "Manage books, authors, publishers, and categories."),
            ],
            "Customer": [
                ("catalog", "view_catalog", "View books and catalog data."),
                ("cart", "manage_own_cart", "Manage own shopping cart."),
                ("orders", "view_own_orders", "View own orders."),
                ("library", "manage_own_library", "Manage own ebook library."),
            ],
        }

        for role_name, permissions in roles.items():
            role, _ = Role.objects.get_or_create(name=role_name)
            for module, code, description in permissions:
                permission, _ = AppPermission.objects.update_or_create(
                    code=code,
                    defaults={
                        "module": module,
                        "description": description,
                    },
                )
                RolePermission.objects.get_or_create(role=role, permission=permission)

    def seed_order_statuses(self):
        legacy_map = {
            "Pending": "pending",
            "Paid": "completed",
            "Completed": "completed",
            "Cancelled": "cancelled",
            "Failed": "failed",
            "Refunded": "refunded",
        }
        for old_name, new_name in legacy_map.items():
            old_status = OrderStatus.objects.filter(name=old_name).first()
            if old_status:
                target_status, _ = OrderStatus.objects.get_or_create(name=new_name)
                if old_status.pk != target_status.pk:
                    ShopOrder.objects.filter(order_status=old_status).update(
                        order_status=target_status
                    )
                    old_status.delete()

        for name in ["pending", "completed", "cancelled", "failed", "refunded"]:
            OrderStatus.objects.get_or_create(name=name)

    def seed_payment_data(self):
        for value in ["Card", "Momo", "ZaloPay", "Bank Transfer", "Cash"]:
            PaymentType.objects.get_or_create(value=value)

        for name in ["Pending", "Success", "Failed", "Refunded"]:
            TransactionStatus.objects.get_or_create(name=name)

    def seed_catalog_reference_data(self):
        for name in ["EPUB", "PDF", "MOBI", "AZW3"]:
            FormatType.objects.get_or_create(name=name)

        categories = {
            "Fiction": ["Fantasy", "Mystery", "Romance"],
            "Technology": ["Programming", "Data Science", "Software Engineering"],
            "Business": ["Marketing", "Management", "Finance"],
        }

        for parent_name, child_names in categories.items():
            parent, _ = Category.objects.get_or_create(name=parent_name, parent=None)
            for child_name in child_names:
                Category.objects.get_or_create(name=child_name, parent=parent)

    def seed_sample_coupon(self):
        Coupon.objects.update_or_create(
            code="WELCOME10",
            defaults={
                "discount_value": Decimal("10000.00"),
                "usage_limit": 100,
                "expiry_date": timezone.now() + timedelta(days=365),
            },
        )
