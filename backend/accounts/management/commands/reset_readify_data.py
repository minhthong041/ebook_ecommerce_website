from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.management.commands.seed_base import Command as SeedBaseCommand
from accounts.models import AppPermission, Customer, Role, RolePermission, UserTokenFamily
from cart.models import ShoppingCart, ShoppingCartItem
from catalog.models import (
    Author,
    Book,
    BookAuthor,
    BookCategory,
    BookChapter,
    BookReview,
    BookSeries,
    Category,
    EbookFile,
    FormatType,
    Publisher,
    Series,
    Wishlist,
)
from library.models import (
    ReaderSetting,
    ReadingProgress,
    UserAnnotation,
    UserBookmark,
    UserLibrary,
    UserLibraryItem,
)
from orders.models import OrderLine, OrderStatus, ShopOrder
from payments.models import PaymentType, Transaction, TransactionStatus
from promotions.models import (
    Coupon,
    CouponBook,
    CouponCategory,
    CouponUsage,
    Promotion,
    PromotionBook,
    PromotionCategory,
)


class Command(BaseCommand):
    help = (
        "Reset local development data while preserving the admin account and "
        "reseeding required system tables."
    )

    def add_arguments(self, parser):
        parser.add_argument("--admin-username", default="admin")
        parser.add_argument("--admin-password", default="caominhthong")
        parser.add_argument("--admin-email", default="admin@example.com")
        parser.add_argument("--with-sample-coupon", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        admin_username = options["admin_username"]
        admin_password = options["admin_password"]
        admin_email = options["admin_email"]

        admin_user = self.ensure_admin_user(
            username=admin_username,
            password=admin_password,
            email=admin_email,
            role=None,
        )

        deleted_counts = self.delete_application_data(admin_user=admin_user)
        self.reset_system_tables()

        seed = SeedBaseCommand()
        seed.stdout = self.stdout
        seed.stderr = self.stderr
        seed.seed_roles_and_permissions()
        seed.seed_order_statuses()
        seed.seed_payment_data()
        seed.seed_catalog_reference_data()
        if options["with_sample_coupon"]:
            seed.seed_sample_coupon()

        admin_role = Role.objects.get(name="Admin")
        admin_user = self.ensure_admin_user(
            username=admin_username,
            password=admin_password,
            email=admin_email,
            role=admin_role,
        )
        Customer.objects.get_or_create(user=admin_user)

        self.stdout.write(self.style.SUCCESS("Readify local data has been reset."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Admin account ready: username={admin_username}, password={admin_password}"
            )
        )
        self.stdout.write(f"Deleted object groups: {deleted_counts}")

    def ensure_admin_user(self, username, password, email, role):
        User = get_user_model()
        user = User.objects.filter(username=username).first()
        if user is None:
            user = User(
                username=username,
                email=email,
                full_name="Administrator",
                is_staff=True,
                is_superuser=True,
                is_active=True,
                role=role,
            )
        else:
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            if role is not None:
                user.role = role

        user.set_password(password)
        user.save()
        return user

    def delete_application_data(self, admin_user):
        User = get_user_model()
        groups = [
            Transaction,
            CouponUsage,
            OrderLine,
            ShopOrder,
            UserBookmark,
            UserAnnotation,
            ReadingProgress,
            UserLibraryItem,
            UserLibrary,
            ReaderSetting,
            ShoppingCartItem,
            ShoppingCart,
            Wishlist,
            BookReview,
            PromotionBook,
            PromotionCategory,
            CouponBook,
            CouponCategory,
            Promotion,
            Coupon,
            EbookFile,
            BookChapter,
            BookSeries,
            BookCategory,
            BookAuthor,
            Book,
            Author,
            Publisher,
            Series,
        ]

        deleted_counts = {}
        for model in groups:
            deleted_counts[model._meta.db_table] = model.objects.all().delete()[0]

        UserTokenFamily.objects.all().delete()
        User.objects.exclude(pk=admin_user.pk).delete()
        Customer.objects.exclude(user=admin_user).delete()
        return deleted_counts

    def reset_system_tables(self):
        for model in [
            RolePermission,
            AppPermission,
            Role,
            OrderStatus,
            PaymentType,
            TransactionStatus,
            FormatType,
            Category,
        ]:
            model.objects.all().delete()
