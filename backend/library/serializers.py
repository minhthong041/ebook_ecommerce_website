from rest_framework import serializers

from catalog.serializers import (
    AuthorSerializer,
    BookChapterSerializer,
    EbookFileSerializer,
    PublisherSerializer,
)
from catalog.models import Book, BookChapter

from .models import (
    ReadingProgress,
    UserAnnotation,
    UserBookmark,
    UserLibrary,
    UserLibraryItem,
)


class UserLibraryItemSerializer(serializers.ModelSerializer):
    book_id = serializers.IntegerField(source="book.id")
    book_title = serializers.CharField(source="book.title")
    authors = serializers.SerializerMethodField()

    class Meta:
        model = UserLibraryItem
        fields = ["id", "book_id", "book_title", "authors", "acquired_date"]

    def get_authors(self, obj):
        return [
            AuthorSerializer(ba.author).data
            for ba in obj.book.book_authors.select_related("author").all()
        ]


class UserLibrarySerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = UserLibrary
        fields = ["id", "name", "description", "items", "item_count", "created_at"]

    def get_items(self, obj):
        items = obj.items.select_related("book").prefetch_related(
            "book__book_authors__author"
        ).all()
        return UserLibraryItemSerializer(items, many=True).data

    def get_item_count(self, obj):
        return obj.items.count()


class ReadingProgressSerializer(serializers.ModelSerializer):
    chapter_title = serializers.CharField(source="chapter.title", read_only=True)
    chapter_order = serializers.IntegerField(source="chapter.order_index", read_only=True)

    class Meta:
        model = ReadingProgress
        fields = [
            "id",
            "book",
            "chapter",
            "chapter_title",
            "chapter_order",
            "cfi_position",
            "percent_complete",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def validate_book(self, value):
        if not Book.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Book not found.")
        return value

    def validate_chapter(self, value):
        if not BookChapter.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Chapter not found.")
        book_id = self.initial_data.get("book")
        if book_id and value.book_id != int(book_id):
            raise serializers.ValidationError("Chapter does not belong to the specified book.")
        return value

    def validate_percent_complete(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Percent complete must be between 0 and 100.")
        return value


class UserBookmarkSerializer(serializers.ModelSerializer):
    chapter_title = serializers.CharField(source="chapter.title", read_only=True)

    class Meta:
        model = UserBookmark
        fields = [
            "id",
            "book",
            "chapter",
            "chapter_title",
            "cfi_position",
            "label",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_book(self, value):
        if not Book.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Book not found.")
        return value

    def validate_chapter(self, value):
        if not BookChapter.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Chapter not found.")
        book_id = self.initial_data.get("book")
        if book_id and value.book_id != int(book_id):
            raise serializers.ValidationError("Chapter does not belong to the specified book.")
        return value


class UserAnnotationSerializer(serializers.ModelSerializer):
    chapter_title = serializers.CharField(source="chapter.title", read_only=True)

    class Meta:
        model = UserAnnotation
        fields = [
            "id",
            "book",
            "chapter",
            "chapter_title",
            "cfi_range",
            "selected_text",
            "note_content",
            "color_code",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_book(self, value):
        if not Book.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Book not found.")
        return value

    def validate_chapter(self, value):
        if not BookChapter.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Chapter not found.")
        book_id = self.initial_data.get("book")
        if book_id and value.book_id != int(book_id):
            raise serializers.ValidationError("Chapter does not belong to the specified book.")
        return value


class LibraryBookDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="book.id")
    title = serializers.CharField(source="book.title")
    publisher = PublisherSerializer(source="book.publisher", read_only=True)
    price = serializers.DecimalField(source="book.price", max_digits=10, decimal_places=2)
    year_of_publication = serializers.IntegerField(source="book.year_of_publication")
    description = serializers.CharField(source="book.description")
    authors = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    series = serializers.SerializerMethodField()
    chapters = BookChapterSerializer(source="book.chapters", many=True, read_only=True)
    ebook_files = EbookFileSerializer(source="book.ebook_files", many=True, read_only=True)
    reading_progress = serializers.SerializerMethodField()
    bookmarks = serializers.SerializerMethodField()
    annotations = serializers.SerializerMethodField()

    def get_authors(self, obj):
        book = obj["book"]
        return [
            AuthorSerializer(ba.author).data
            for ba in book.book_authors.select_related("author").all()
        ]

    def get_categories(self, obj):
        book = obj["book"]
        return [
            {"id": bc.category_id, "name": bc.category.name}
            for bc in book.book_categories.select_related("category").all()
        ]

    def get_series(self, obj):
        book = obj["book"]
        return [
            {
                "id": bs.series_id,
                "name": bs.series.name,
                "volume_number": bs.volume_number,
            }
            for bs in book.book_series.select_related("series").all()
        ]

    def get_reading_progress(self, obj):
        return ReadingProgressSerializer(obj["reading_progress"], many=True).data

    def get_bookmarks(self, obj):
        return UserBookmarkSerializer(obj["bookmarks"], many=True).data

    def get_annotations(self, obj):
        return UserAnnotationSerializer(obj["annotations"], many=True).data
