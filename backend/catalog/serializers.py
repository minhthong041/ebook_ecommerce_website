import hashlib
from pathlib import Path

from django.core.exceptions import DisallowedHost
from django.db import transaction
from rest_framework import serializers

from .ebook_preview import build_book_preview
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
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EbookFile
        fields = [
            "id",
            "format_type",
            "file_url",
            "file_size_bytes",
            "is_drm_protected",
        ]

    def get_file_url(self, obj):
        if not obj.file_url:
            return None

        try:
            url = obj.file_url.url
        except ValueError:
            url = str(obj.file_url)

        request = self.context.get("request")
        if request:
            try:
                return request.build_absolute_uri(url)
            except DisallowedHost:
                return url
        return url


class BookReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = BookReview
        fields = [
            "id",
            "book",
            "rating",
            "title",
            "comment",
            "is_purchased",
            "status",
            "user",
            "date",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "is_purchased",
            "status",
            "user",
            "date",
            "created_at",
        ]

    def get_user(self, obj):
        user = obj.customer.user
        return user.full_name or user.username

    def get_date(self, obj):
        return obj.created_at.strftime("%d/%m/%Y")


class BookReviewSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookReview
        fields = ["book", "rating", "title", "comment"]


class StaffBookReviewSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = BookReview
        fields = [
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "book",
            "book_title",
            "rating",
            "title",
            "comment",
            "is_purchased",
            "status",
            "status_label",
            "created_at",
        ]
        read_only_fields = fields

    def get_customer_name(self, obj):
        user = obj.customer.user
        return user.full_name or user.username

    def get_customer_email(self, obj):
        return obj.customer.user.email


class StaffBookReviewUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=BookReview.Status.choices)

    class Meta:
        model = BookReview
        fields = ["status"]


class BookListSerializer(serializers.ModelSerializer):
    publisher = PublisherSerializer(read_only=True)
    authors = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()
    format_labels = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "publisher",
            "price",
            "year_of_publication",
            "description",
            "is_active",
            "authors",
            "categories",
            "cover_url",
            "format_labels",
            "average_rating",
            "review_count",
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
        stored_url = self._get_json_url(obj.book_image)
        if stored_url:
            return self._build_absolute_url(stored_url)

        if not obj.cover_image:
            return None

        return self._build_absolute_url(obj.cover_image.url)

    def _get_json_url(self, payload):
        if isinstance(payload, dict):
            return payload.get("url")
        if isinstance(payload, str):
            return payload
        return None

    def _build_absolute_url(self, url):
        if url.startswith(("http://", "https://")):
            return url
        request = self.context.get("request")
        if request:
            try:
                return request.build_absolute_uri(url)
            except DisallowedHost:
                return url
        return url

    def get_format_labels(self, obj):
        return [
            ebook_file.format_type.name
            for ebook_file in obj.ebook_files.select_related("format_type").all()
        ]

    def get_average_rating(self, obj):
        reviews = [
            review
            for review in obj.reviews.all()
            if review.is_purchased and review.status == BookReview.Status.APPROVED
        ]
        if not reviews:
            return 0
        total_rating = sum(int(review.rating or 0) for review in reviews)
        return round(total_rating / len(reviews), 1)

    def get_review_count(self, obj):
        return len(
            [
                review
                for review in obj.reviews.all()
                if review.is_purchased and review.status == BookReview.Status.APPROVED
            ]
        )


class BookDetailSerializer(BookListSerializer):
    series = serializers.SerializerMethodField()
    chapters = BookChapterSerializer(many=True, read_only=True)
    ebook_files = EbookFileSerializer(many=True, read_only=True)
    preview_text = serializers.SerializerMethodField()
    preview_source_format = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta(BookListSerializer.Meta):
        fields = BookListSerializer.Meta.fields + [
            "series",
            "chapters",
            "ebook_files",
            "preview_text",
            "preview_source_format",
            "reviews",
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

    def get_preview_text(self, obj):
        return self._get_preview_payload(obj)["text"]

    def get_preview_source_format(self, obj):
        return self._get_preview_payload(obj)["source_format"]

    def _get_preview_payload(self, obj):
        if not hasattr(obj, "_preview_payload"):
            obj._preview_payload = build_book_preview(obj)
        return obj._preview_payload

    def get_reviews(self, obj):
        reviews = [
            review
            for review in obj.reviews.all()
            if review.is_purchased and review.status == BookReview.Status.APPROVED
        ]
        return BookReviewSerializer(reviews, many=True).data


class StaffBookManagementSerializer(BookDetailSerializer):
    ebook_file_count = serializers.SerializerMethodField()

    class Meta(BookDetailSerializer.Meta):
        fields = BookDetailSerializer.Meta.fields + [
            "ebook_file_count",
        ]

    def get_ebook_file_count(self, obj):
        return obj.ebook_files.count()


class StaffBookUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=100, required=False)
    publisher_name = serializers.CharField(max_length=100, required=False)
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False,
    )
    year_of_publication = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=0,
    )
    description = serializers.CharField(required=False, allow_blank=True)
    authors = serializers.CharField(required=False, allow_blank=True)
    categories = serializers.CharField(required=False, allow_blank=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)

    def update(self, instance, validated_data):
        publisher_name = validated_data.pop("publisher_name", None)
        authors = validated_data.pop("authors", None)
        categories = validated_data.pop("categories", None)
        cover_marker = object()
        cover_image = validated_data.pop("cover_image", cover_marker)

        with transaction.atomic():
            if publisher_name is not None:
                publisher, _ = Publisher.objects.get_or_create(
                    name=publisher_name.strip(),
                )
                instance.publisher = publisher

            for field_name, value in validated_data.items():
                setattr(instance, field_name, value)

            old_cover_image = None
            if cover_image is not cover_marker:
                old_cover_image = instance.cover_image
                instance.cover_image = cover_image

            instance.save()

            if cover_image is not cover_marker:
                instance.book_image = self._build_file_payload(instance.cover_image)
                instance.save(update_fields=["book_image"])
                current_cover_name = instance.cover_image.name if instance.cover_image else ""
                if old_cover_image and old_cover_image.name != current_cover_name:
                    old_cover_image.delete(save=False)

            if authors is not None:
                BookAuthor.objects.filter(book=instance).delete()
                for author_name in self._split_names(authors):
                    author, _ = Author.objects.get_or_create(full_name=author_name)
                    BookAuthor.objects.get_or_create(book=instance, author=author)

            if categories is not None:
                BookCategory.objects.filter(book=instance).delete()
                for category_name in self._split_names(categories):
                    category, _ = Category.objects.get_or_create(
                        name=category_name,
                        parent=None,
                    )
                    BookCategory.objects.get_or_create(book=instance, category=category)

        return instance

    def _split_names(self, raw_value):
        return [
            value.strip()
            for value in raw_value.split(",")
            if value and value.strip()
        ]

    def _build_file_payload(self, file_field):
        if not file_field:
            return {}
        return {
            "url": file_field.url,
            "path": file_field.name,
            "storage": "local",
        }


class StaffBookUploadSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=100)
    publisher_name = serializers.CharField(max_length=100)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    year_of_publication = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    description = serializers.CharField(required=False, allow_blank=True)
    authors = serializers.CharField(required=False, allow_blank=True)
    categories = serializers.CharField(required=False, allow_blank=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    pdf_file = serializers.FileField(required=False, allow_null=True)
    epub_file = serializers.FileField(required=False, allow_null=True)
    mobi_file = serializers.FileField(required=False, allow_null=True)
    is_drm_protected = serializers.BooleanField(required=False, default=False)
    is_active = serializers.BooleanField(required=False, default=True)

    allowed_extensions = {
        "pdf_file": ".pdf",
        "epub_file": ".epub",
        "mobi_file": ".mobi",
    }

    def validate(self, attrs):
        missing_files = [
            field_name
            for field_name in self.allowed_extensions
            if not attrs.get(field_name)
        ]
        if missing_files:
            raise serializers.ValidationError(
                {
                    field_name: "Bắt buộc upload đủ 3 định dạng PDF, EPUB và MOBI."
                    for field_name in missing_files
                }
            )

        for field_name, expected_extension in self.allowed_extensions.items():
            uploaded_file = attrs.get(field_name)
            if uploaded_file:
                extension = Path(uploaded_file.name).suffix.lower()
                if extension != expected_extension:
                    raise serializers.ValidationError(
                        {field_name: f"File must use the {expected_extension} extension."}
                    )

        return attrs

    def create(self, validated_data):
        publisher_name = validated_data.pop("publisher_name")
        authors = self._split_names(validated_data.pop("authors", ""))
        categories = self._split_names(validated_data.pop("categories", ""))
        cover_image = validated_data.pop("cover_image", None)
        is_drm_protected = validated_data.pop("is_drm_protected", False)
        ebook_files = {
            "PDF": validated_data.pop("pdf_file", None),
            "EPUB": validated_data.pop("epub_file", None),
            "MOBI": validated_data.pop("mobi_file", None),
        }

        with transaction.atomic():
            publisher, _ = Publisher.objects.get_or_create(name=publisher_name.strip())
            book = Book.objects.create(
                publisher=publisher,
                cover_image=cover_image,
                **validated_data,
            )
            if cover_image:
                book.book_image = self._build_file_payload(book.cover_image)
                book.save(update_fields=["book_image"])

            for author_name in authors:
                author, _ = Author.objects.get_or_create(full_name=author_name)
                BookAuthor.objects.get_or_create(book=book, author=author)

            for category_name in categories:
                category, _ = Category.objects.get_or_create(
                    name=category_name,
                    parent=None,
                )
                BookCategory.objects.get_or_create(book=book, category=category)

            for format_name, uploaded_file in ebook_files.items():
                if not uploaded_file:
                    continue

                format_type, _ = FormatType.objects.get_or_create(name=format_name)
                EbookFile.objects.update_or_create(
                    book=book,
                    format_type=format_type,
                    defaults={
                        "file_url": uploaded_file,
                        "file_size_bytes": uploaded_file.size,
                        "file_hash": self._hash_file(uploaded_file),
                        "is_drm_protected": is_drm_protected,
                    },
                )

        return book

    def _split_names(self, raw_value):
        return [
            value.strip()
            for value in raw_value.split(",")
            if value and value.strip()
        ]

    def _hash_file(self, uploaded_file):
        digest = hashlib.sha256()
        for chunk in uploaded_file.chunks():
            digest.update(chunk)
        uploaded_file.seek(0)
        return digest.hexdigest()

    def _build_file_payload(self, file_field):
        if not file_field:
            return {}
        return {
            "url": file_field.url,
            "path": file_field.name,
            "storage": "local",
        }
