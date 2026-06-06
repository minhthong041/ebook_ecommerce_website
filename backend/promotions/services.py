from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Coupon, CouponUsage, Promotion


MONEY_QUANTIZER = Decimal("0.01")


def as_money(value):
    return Decimal(value or 0).quantize(MONEY_QUANTIZER, rounding=ROUND_HALF_UP)


def normalize_rate(value):
    rate = Decimal(value or 0)
    if rate < 0:
        return Decimal("0")
    if rate > 100:
        return Decimal("100")
    return rate


def get_active_promotions():
    today = timezone.localdate()
    return Promotion.objects.filter(start_date__lte=today, end_date__gte=today)


def get_best_promotion_for_book(book):
    category_ids = list(book.book_categories.values_list("category_id", flat=True))
    return (
        get_active_promotions()
        .filter(
            Q(promotion_books__book_id=book.pk)
            | Q(promotion_categories__category_id__in=category_ids)
        )
        .distinct()
        .order_by("-discount_rate", "name")
        .first()
    )


def get_promotional_pricing(book):
    original_price = as_money(book.price)
    promotion = get_best_promotion_for_book(book)
    if not promotion:
        return {
            "book": book,
            "original_price": original_price,
            "price": original_price,
            "promotion_discount": Decimal("0.00"),
            "promotion_discount_rate": Decimal("0.00"),
            "promotion_name": "",
        }

    rate = normalize_rate(promotion.discount_rate)
    discount = as_money(original_price * rate / Decimal("100"))
    price = max(original_price - discount, Decimal("0.00"))
    return {
        "book": book,
        "original_price": original_price,
        "price": price,
        "promotion_discount": discount,
        "promotion_discount_rate": rate,
        "promotion_name": promotion.name,
    }


def coupon_applies_to_book(coupon, book):
    book_ids = set(coupon.coupon_books.values_list("book_id", flat=True))
    category_ids = set(coupon.coupon_categories.values_list("category_id", flat=True))
    if not book_ids and not category_ids:
        return True
    if book.pk in book_ids:
        return True
    book_category_ids = set(book.book_categories.values_list("category_id", flat=True))
    return bool(category_ids.intersection(book_category_ids))


def get_valid_coupon(code):
    normalized_code = str(code or "").strip()
    if not normalized_code:
        return None

    try:
        coupon = (
            Coupon.objects.prefetch_related(
                "coupon_books",
                "coupon_categories",
            )
            .get(code__iexact=normalized_code)
        )
    except Coupon.DoesNotExist as exc:
        raise ValidationError({"coupon_code": "Mã giảm giá không tồn tại."}) from exc

    if coupon.expiry_date < timezone.now():
        raise ValidationError({"coupon_code": "Mã giảm giá đã hết hạn."})

    if coupon.usage_limit is not None:
        usage_count = CouponUsage.objects.filter(coupon=coupon).count()
        if usage_count >= coupon.usage_limit:
            raise ValidationError({"coupon_code": "Mã giảm giá đã hết lượt sử dụng."})

    return coupon


def calculate_cart_pricing(cart_items, coupon_code=""):
    line_items = []
    original_subtotal = Decimal("0.00")
    promotion_subtotal = Decimal("0.00")
    promotion_discount_total = Decimal("0.00")

    for cart_item in cart_items:
        pricing = get_promotional_pricing(cart_item.book)
        original_subtotal += pricing["original_price"]
        promotion_subtotal += pricing["price"]
        promotion_discount_total += pricing["promotion_discount"]
        line_items.append(
            {
                **pricing,
                "cart_item": cart_item,
                "book": cart_item.book,
            }
        )

    coupon = get_valid_coupon(coupon_code)
    coupon_discount = Decimal("0.00")

    if coupon:
        eligible_subtotal = sum(
            (line["price"] for line in line_items if coupon_applies_to_book(coupon, line["book"])),
            Decimal("0.00"),
        )
        if eligible_subtotal <= 0:
            raise ValidationError(
                {"coupon_code": "Mã giảm giá không áp dụng cho sách trong giỏ hàng."}
            )
        coupon_discount = min(as_money(coupon.discount_value), as_money(eligible_subtotal))

    total_price = max(as_money(promotion_subtotal - coupon_discount), Decimal("0.00"))
    total_discount = as_money(promotion_discount_total + coupon_discount)

    return {
        "line_items": line_items,
        "coupon": coupon,
        "original_subtotal": as_money(original_subtotal),
        "promotion_subtotal": as_money(promotion_subtotal),
        "promotion_discount": as_money(promotion_discount_total),
        "coupon_discount": as_money(coupon_discount),
        "discount_amount": total_discount,
        "total_price": total_price,
    }
