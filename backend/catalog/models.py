from django.core.validators import MinValueValidator
from django.db import models


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
    file_url = models.CharField(max_length=500)
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
