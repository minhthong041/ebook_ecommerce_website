from rest_framework import filters, viewsets
from rest_framework.pagination import PageNumberPagination

from .models import Author, Book, Category, FormatType, Publisher, Series
from .serializers import (
    AuthorSerializer,
    BookDetailSerializer,
    BookListSerializer,
    CategorySerializer,
    FormatTypeSerializer,
    PublisherSerializer,
    SeriesSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Book.objects.prefetch_related(
        "book_authors__author",
        "book_categories__category",
        "book_series__series",
        "chapters",
        "ebook_files__format_type",
    ).select_related("publisher")
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "book_authors__author__full_name"]
    ordering_fields = ["title", "price", "year_of_publication"]
    ordering = ["title"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BookDetailSerializer
        return BookListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        publisher = self.request.query_params.get("publisher")
        if category:
            qs = qs.filter(book_categories__category_id=category)
        if publisher:
            qs = qs.filter(publisher_id=publisher)
        return qs.distinct()


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.prefetch_related("children").all()
    serializer_class = CategorySerializer
    pagination_class = None


class AuthorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    pagination_class = StandardResultsSetPagination
    search_fields = ["full_name"]


class PublisherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Publisher.objects.all()
    serializer_class = PublisherSerializer
    pagination_class = None


class FormatTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FormatType.objects.all()
    serializer_class = FormatTypeSerializer
    pagination_class = None


class SeriesViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Series.objects.all()
    serializer_class = SeriesSerializer
    pagination_class = None
