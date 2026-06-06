from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User, UserTokenFamily
from accounts.views import get_tokens_for_user
from cart.models import ShoppingCart, ShoppingCartItem
from catalog.models import Book, BookCategory, Category, Publisher
from orders.models import ShopOrder

from .models import Coupon, CouponUsage, Promotion
from .services import get_promotional_pricing


def create_book(title="Promotion Test Book", price="100000.00"):
    publisher = Publisher.objects.create(name=f"{title} Publisher")
    return Book.objects.create(
        title=title,
        publisher=publisher,
        price=price,
        year_of_publication=2024,
        description="Test ebook",
    )


class PromotionPricingUnitTests(APITestCase):
    def test_category_promotion_discounts_book_price(self):
        book = create_book()
        category = Category.objects.create(name="Triết học")
        BookCategory.objects.create(book=book, category=category)
        promotion = Promotion.objects.create(
            name="Sale category",
            discount_rate=Decimal("20.00"),
            start_date=timezone.localdate() - timedelta(days=1),
            end_date=timezone.localdate() + timedelta(days=1),
        )
        promotion.categories.add(category)

        pricing = get_promotional_pricing(book)

        self.assertEqual(pricing["original_price"], Decimal("100000.00"))
        self.assertEqual(pricing["price"], Decimal("80000.00"))
        self.assertEqual(pricing["promotion_discount_rate"], Decimal("20.00"))


class CouponCheckoutIntegrationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="coupon_user",
            email="coupon_user@example.com",
            full_name="Coupon User",
            password="ReadifyPass123!",
        )
        family = UserTokenFamily.objects.create(user=self.user)
        access_token, _ = get_tokens_for_user(self.user, family.id)
        self.client.cookies["access_token"] = access_token

    def test_checkout_applies_coupon_and_records_usage(self):
        book = create_book(price="100000.00")
        cart = ShoppingCart.objects.create(customer=self.user.customer)
        ShoppingCartItem.objects.create(cart=cart, book=book)
        coupon = Coupon.objects.create(
            code="SAVE10",
            discount_value=Decimal("10000.00"),
            usage_limit=3,
            expiry_date=timezone.now() + timedelta(days=1),
        )

        response = self.client.post(
            reverse("checkout"),
            {
                "payment_method": "card",
                "coupon_code": "SAVE10",
                "card": {
                    "token": "demo-token",
                    "brand": "Visa",
                    "last4": "4242",
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = ShopOrder.objects.get()
        self.assertEqual(order.coupon, coupon)
        self.assertEqual(order.total_price, Decimal("90000.00"))
        self.assertEqual(order.discount_amount, Decimal("10000.00"))
        self.assertTrue(
            CouponUsage.objects.filter(
                order=order,
                customer=self.user.customer,
                coupon=coupon,
                discount_applied=Decimal("10000.00"),
            ).exists()
        )


class PromotionAdminApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="promotion_admin",
            email="promotion_admin@example.com",
            password="ReadifyPass123!",
        )
        family = UserTokenFamily.objects.create(user=self.admin)
        access_token, _ = get_tokens_for_user(self.admin, family.id)
        self.client.cookies["access_token"] = access_token

    def test_admin_can_create_promotion_for_book_and_category(self):
        book = create_book("Admin Promo Book")
        category = Category.objects.create(name="Kinh doanh")
        payload = {
            "name": "Sale admin",
            "description": "Admin managed promotion",
            "discount_rate": "15.00",
            "start_date": str(timezone.localdate()),
            "end_date": str(timezone.localdate() + timedelta(days=7)),
            "book_ids": [book.id],
            "category_ids": [category.id],
        }

        response = self.client.post("/api/admin/promotions/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["book_ids"], [book.id])
        self.assertEqual(response.data["category_ids"], [category.id])
        self.assertEqual(response.data["book_count"], 1)
        self.assertEqual(response.data["category_count"], 1)
