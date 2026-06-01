from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import AppPermission, Role, RolePermission
from catalog.models import (
    Author,
    Book,
    BookAuthor,
    BookCategory,
    Category,
    FormatType,
    Publisher,
)
from orders.models import OrderStatus
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
        roles = {
            "Admin": [
                ("accounts", "manage_users", "Manage users, customers, roles, and permissions."),
                ("catalog", "manage_catalog", "Manage books, authors, publishers, and categories."),
                ("orders", "manage_orders", "Manage orders and order statuses."),
                ("payments", "manage_payments", "Manage payment methods and transactions."),
                ("promotions", "manage_promotions", "Manage coupons and promotions."),
                ("library", "manage_library", "Manage customer libraries and reading data."),
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
        for name in ["Pending", "Paid", "Completed", "Cancelled", "Refunded"]:
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

        category_map = {}
        for parent_name, child_names in categories.items():
            parent, _ = Category.objects.get_or_create(name=parent_name, parent=None)
            category_map[parent_name] = parent
            for child_name in child_names:
                child, _ = Category.objects.get_or_create(name=child_name, parent=parent)
                category_map[child_name] = child

        publishers = {
            "Open Books Publishing": Publisher.objects.get_or_create(
                name="Open Books Publishing"
            )[0],
            "Tech Press": Publisher.objects.get_or_create(name="Tech Press")[0],
            "Business House": Publisher.objects.get_or_create(name="Business House")[0],
        }

        authors = {
            "An Nguyen": Author.objects.get_or_create(full_name="An Nguyen")[0],
            "Minh Tran": Author.objects.get_or_create(full_name="Minh Tran")[0],
            "Linh Pham": Author.objects.get_or_create(full_name="Linh Pham")[0],
        }

        sample_books = [
            {
                "title": "Django API Foundations",
                "publisher": publishers["Tech Press"],
                "price": Decimal("149000.00"),
                "year_of_publication": 2025,
                "description": "A practical introduction to building APIs with Django REST Framework.",
                "authors": [authors["Minh Tran"]],
                "categories": [category_map["Technology"], category_map["Programming"]],
            },
            {
                "title": "React Storefront Essentials",
                "publisher": publishers["Tech Press"],
                "price": Decimal("129000.00"),
                "year_of_publication": 2025,
                "description": "Build reusable storefront interfaces with React and modern frontend tooling.",
                "authors": [authors["An Nguyen"]],
                "categories": [category_map["Technology"], category_map["Software Engineering"]],
            },
            {
                "title": "Digital Business Basics",
                "publisher": publishers["Business House"],
                "price": Decimal("99000.00"),
                "year_of_publication": 2024,
                "description": "Core concepts for running and growing digital commerce products.",
                "authors": [authors["Linh Pham"]],
                "categories": [category_map["Business"], category_map["Marketing"]],
            },
            {
                "title": "The Library of Hidden Pages",
                "publisher": publishers["Open Books Publishing"],
                "price": Decimal("79000.00"),
                "year_of_publication": 2023,
                "description": "A light fantasy novel for testing the ebook storefront experience.",
                "authors": [authors["An Nguyen"], authors["Linh Pham"]],
                "categories": [category_map["Fiction"], category_map["Fantasy"]],
            },
        ]

        for book_data in sample_books:
            authors_for_book = book_data.pop("authors")
            categories_for_book = book_data.pop("categories")
            book, _ = Book.objects.update_or_create(
                title=book_data["title"],
                defaults=book_data,
            )
            for author in authors_for_book:
                BookAuthor.objects.get_or_create(book=book, author=author)
            for category in categories_for_book:
                BookCategory.objects.get_or_create(book=book, category=category)

    def seed_sample_coupon(self):
        Coupon.objects.update_or_create(
            code="WELCOME10",
            defaults={
                "discount_value": Decimal("10000.00"),
                "usage_limit": 100,
                "expiry_date": timezone.now() + timedelta(days=365),
            },
        )
