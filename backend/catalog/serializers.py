from rest_framework import serializers

from .models import (
    Author,
    Book,
    BookAuthor,
    BookCategory,
    BookChapter,
    BookSeries,
    Category,
    EbookFile,
    FormatType,
    Publisher,
    Series,
)


class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ["id", "name"]


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "full_name"]


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "parent", "children"]

    def get_children(self, obj):
        children = obj.children.all()
        if children:
            return CategorySerializer(children, many=True).data
        return []


class FormatTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormatType
        fields = ["id", "name"]


class SeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Series
        fields = ["id", "name", "description"]


class BookChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookChapter
        fields = ["id", "title", "order_index", "content_url"]


class EbookFileSerializer(serializers.ModelSerializer):
    format_type = FormatTypeSerializer(read_only=True)

    class Meta:
        model = EbookFile
        fields = [
            "id",
            "format_type",
            "file_url",
            "file_size_bytes",
            "is_drm_protected",
        ]


class BookListSerializer(serializers.ModelSerializer):
    publisher = PublisherSerializer(read_only=True)
    authors = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "publisher",
            "price",
            "year_of_publication",
            "description",
            "authors",
            "categories",
            "cover_url",
        ]

    def get_authors(self, obj):
        return [
            AuthorSerializer(ba.author).data
            for ba in obj.book_authors.select_related("author").all()
        ]

    def get_categories(self, obj):
        return [
            {"id": bc.category_id, "name": bc.category.name}
            for bc in obj.book_categories.select_related("category").all()
        ]

    def get_cover_url(self, obj):
        return None


class BookDetailSerializer(BookListSerializer):
    series = serializers.SerializerMethodField()
    chapters = BookChapterSerializer(many=True, read_only=True)
    ebook_files = EbookFileSerializer(many=True, read_only=True)

    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + [
            "series",
            "chapters",
            "ebook_files",
        ]

    def get_series(self, obj):
        return [
            {
                "id": bs.series_id,
                "name": bs.series.name,
                "volume_number": bs.volume_number,
            }
            for bs in obj.book_series.select_related("series").all()
        ]
