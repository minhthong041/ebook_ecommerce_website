from pathlib import Path
from uuid import uuid4

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify


def book_cover_upload_to(instance, filename):
    extension = Path(filename).suffix.lower()
    title = slugify(instance.title) or f"book-{instance.pk or 'new'}"
    return f"covers/{title}-{uuid4().hex[:8]}{extension}"


def ebook_file_upload_to(instance, filename):
    extension = Path(filename).suffix.lower()
    title = slugify(instance.book.title) or f"book-{instance.book_id}"
    format_name = slugify(instance.format_type.name).lower() or "ebook"
    return f"ebooks/{format_name}/{title}-{uuid4().hex[:8]}{extension}"


class Publisher(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "publishers"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Author(models.Model):
    full_name = models.CharField(max_length=100)

    class Meta:
        db_table = "authors"
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name


class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="parent_id",
        related_name="children",
    )

    class Meta:
        db_table = "categories"
        ordering = ["name"]
        verbose_name_plural = "categories"
        unique_together = ("name", "parent")

    def __str__(self):
        return self.name


class Series(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "series"
        ordering = ["name"]
        verbose_name_plural = "series"

    def __str__(self):
        return self.name


class FormatType(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "format_types"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Book(models.Model):
    title = models.CharField(max_length=100)
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.PROTECT,
        db_column="publisher_id",
        related_name="books",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    year_of_publication = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    cover_image = models.ImageField(
        upload_to=book_cover_upload_to,
        max_length=500,
        null=True,
        blank=True,
    )
    book_image = models.JSONField(default=dict, blank=True)

    authors = models.ManyToManyField(
        Author,
        through="BookAuthor",
        related_name="books",
    )
    categories = models.ManyToManyField(
        Category,
        through="BookCategory",
        related_name="books",
    )
    series = models.ManyToManyField(
        Series,
        through="BookSeries",
        related_name="books",
    )

    class Meta:
        db_table = "books"
        ordering = ["title"]

    def __str__(self):
        return self.title


class BookAuthor(models.Model):
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="book_authors",
    )
    author = models.ForeignKey(
        Author,
        on_delete=models.PROTECT,
        db_column="author_id",
        related_name="book_authors",
    )

    class Meta:
        db_table = "book_authors"
        unique_together = ("book", "author")

    def __str__(self):
        return f"{self.book} - {self.author}"


class BookCategory(models.Model):
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="book_categories",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        db_column="category_id",
        related_name="book_categories",
    )

    class Meta:
        db_table = "book_categories"
        unique_together = ("book", "category")

    def __str__(self):
        return f"{self.book} - {self.category}"


class BookSeries(models.Model):
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="book_series",
    )
    series = models.ForeignKey(
        Series,
        on_delete=models.PROTECT,
        db_column="series_id",
        related_name="book_series",
    )
    volume_number = models.PositiveIntegerField()

    class Meta:
        db_table = "book_series"
        verbose_name_plural = "book series"
        constraints = [
            models.UniqueConstraint(
                fields=["book", "series"],
                name="unique_book_series",
            ),
            models.UniqueConstraint(
                fields=["series", "volume_number"],
                name="unique_volume_per_series",
            ),
        ]

    def __str__(self):
        return f"{self.series} #{self.volume_number}: {self.book}"


class BookChapter(models.Model):
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="chapters",
    )
    title = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField()
    content_url = models.CharField(max_length=500)

    class Meta:
        db_table = "book_chapters"
        ordering = ["book", "order_index"]
        constraints = [
            models.UniqueConstraint(
                fields=["book", "order_index"],
                name="unique_chapter_order_per_book",
            ),
        ]

    def __str__(self):
        return f"{self.book} - {self.order_index}. {self.title}"


class EbookFile(models.Model):
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="ebook_files",
    )
    format_type = models.ForeignKey(
        FormatType,
        on_delete=models.PROTECT,
        db_column="format_type_id",
        related_name="ebook_files",
    )
    file_url = models.FileField(upload_to=ebook_file_upload_to, max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size_bytes = models.BigIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    is_drm_protected = models.BooleanField(default=False)
    file_hash = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "ebook_files"
        ordering = ["book", "format_type"]
        unique_together = ("book", "format_type")

    def __str__(self):
        return f"{self.book} - {self.format_type}"


class BookReview(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        REPORTED = "reported", "Reported"
        HIDDEN = "hidden", "Hidden"
        DELETED = "deleted", "Deleted"

    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="book_reviews",
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="reviews",
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=255, blank=True, default="")
    comment = models.TextField(blank=True, default="")
    is_purchased = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "book_reviews"
        ordering = ["-created_at"]
        unique_together = ("customer", "book")

    def __str__(self):
        return f"{self.customer} - {self.book}: {self.rating}"


class Wishlist(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="wishlists",
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="wishlisted_by",
    )

    class Meta:
        db_table = "wishlists"
        unique_together = ("customer", "book")

    def __str__(self):
        return f"{self.customer} - {self.book}"
