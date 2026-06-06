from django.contrib import admin

from .models import (
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


class BookAuthorInline(admin.TabularInline):
    model = BookAuthor
    extra = 1
    autocomplete_fields = ("author",)


class BookCategoryInline(admin.TabularInline):
    model = BookCategory
    extra = 1
    autocomplete_fields = ("category",)


class BookSeriesInline(admin.TabularInline):
    model = BookSeries
    extra = 0
    autocomplete_fields = ("series",)


class BookChapterInline(admin.TabularInline):
    model = BookChapter
    extra = 0


class EbookFileInline(admin.TabularInline):
    model = EbookFile
    extra = 0
    autocomplete_fields = ("format_type",)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "publisher", "price", "year_of_publication", "is_active")
    list_filter = ("is_active", "publisher", "categories", "authors", "series")
    search_fields = ("title", "publisher__name", "authors__full_name")
    autocomplete_fields = ("publisher",)
    inlines = (
        BookAuthorInline,
        BookCategoryInline,
        BookSeriesInline,
        BookChapterInline,
        EbookFileInline,
    )


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name")
    search_fields = ("full_name",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parent")
    list_filter = ("parent",)
    search_fields = ("name", "parent__name")
    autocomplete_fields = ("parent",)


@admin.register(Series)
class SeriesAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(FormatType)
class FormatTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(BookChapter)
class BookChapterAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "order_index", "title")
    list_filter = ("book",)
    search_fields = ("book__title", "title")
    autocomplete_fields = ("book",)


@admin.register(EbookFile)
class EbookFileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "book",
        "format_type",
        "file_size_bytes",
        "is_drm_protected",
        "uploaded_at",
    )
    list_filter = ("format_type", "is_drm_protected")
    search_fields = ("book__title", "file_url", "file_hash")
    autocomplete_fields = ("book", "format_type")


@admin.register(BookAuthor)
class BookAuthorAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "author")
    autocomplete_fields = ("book", "author")


@admin.register(BookCategory)
class BookCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "category")
    autocomplete_fields = ("book", "category")


@admin.register(BookSeries)
class BookSeriesAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "series", "volume_number")
    autocomplete_fields = ("book", "series")


@admin.register(BookReview)
class BookReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "book",
        "customer",
        "rating",
        "title",
        "is_purchased",
        "status",
        "created_at",
    )
    list_filter = ("rating", "is_purchased", "status", "created_at")
    search_fields = (
        "book__title",
        "customer__user__username",
        "customer__user__full_name",
        "comment",
    )
    autocomplete_fields = ("book", "customer")


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "book")
    search_fields = (
        "customer__user__username",
        "customer__user__full_name",
        "book__title",
    )
    autocomplete_fields = ("customer", "book")
