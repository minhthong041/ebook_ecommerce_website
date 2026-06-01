from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class UserLibrary(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="libraries",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_libraries"
        verbose_name_plural = "user libraries"
        unique_together = ("customer", "name")

    def __str__(self):
        return f"{self.customer} - {self.name}"


class UserLibraryItem(models.Model):
    library = models.ForeignKey(
        UserLibrary,
        on_delete=models.CASCADE,
        db_column="library_id",
        related_name="items",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="library_items",
    )
    acquired_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_library_items"
        unique_together = ("library", "book")

    def __str__(self):
        return f"{self.library} - {self.book}"


class ReaderSetting(models.Model):
    customer = models.OneToOneField(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="reader_setting",
    )
    preferences = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reader_settings"

    def __str__(self):
        return f"Reader settings - {self.customer}"


class UserBookmark(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="bookmarks",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="bookmarks",
    )
    chapter = models.ForeignKey(
        "catalog.BookChapter",
        on_delete=models.CASCADE,
        db_column="chapter_id",
        related_name="bookmarks",
    )
    cfi_position = models.CharField(max_length=255)
    label = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_bookmarks"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer} - {self.book}"


class UserAnnotation(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="annotations",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="annotations",
    )
    chapter = models.ForeignKey(
        "catalog.BookChapter",
        on_delete=models.CASCADE,
        db_column="chapter_id",
        related_name="annotations",
    )
    cfi_range = models.CharField(max_length=255)
    selected_text = models.TextField()
    note_content = models.TextField(blank=True)
    color_code = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_annotations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer} - {self.book}"


class ReadingProgress(models.Model):
    customer = models.ForeignKey(
        "accounts.Customer",
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="reading_progress",
    )
    book = models.ForeignKey(
        "catalog.Book",
        on_delete=models.CASCADE,
        db_column="book_id",
        related_name="reading_progress",
    )
    chapter = models.ForeignKey(
        "catalog.BookChapter",
        on_delete=models.CASCADE,
        db_column="chapter_id",
        related_name="reading_progress",
    )
    cfi_position = models.CharField(max_length=255)
    percent_complete = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reading_progress"
        verbose_name_plural = "reading progress"
        unique_together = ("customer", "book", "chapter")

    def __str__(self):
        return f"{self.customer} - {self.book}: {self.percent_complete}%"
