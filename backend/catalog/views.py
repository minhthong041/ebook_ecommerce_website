from django.db.models import Count, Q
from django.db.models.deletion import ProtectedError
from rest_framework import filters, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from accounts.authentications import JWTAuthentication
from accounts.models import Customer
from accounts.permissions import IsSystemAdmin

from .models import Author, Book, BookReview, Category, FormatType, Publisher, Series, Wishlist
from .permissions import IsCatalogStaff
from .serializers import (
    AdminCategorySerializer,
    AuthorSerializer,
    BookDetailSerializer,
    BookListSerializer,
    BookReviewSerializer,
    CategorySerializer,
    FormatTypeSerializer,
    PublisherSerializer,
    SeriesSerializer,
    StaffBookReviewSerializer,
    StaffBookReviewUpdateSerializer,
    StaffBookManagementSerializer,
    StaffBookUpdateSerializer,
    StaffBookUploadSerializer,
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
        "reviews__customer__user",
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
    queryset = (
        Category.objects.prefetch_related("children")
        .annotate(book_count=Count("book_categories", distinct=True))
        .order_by("-book_count", "name")
    )
    serializer_class = CategorySerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["name", "book_count"]
    ordering = ["-book_count", "name"]
    pagination_class = None


class AdminCategoryViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsSystemAdmin]
    serializer_class = AdminCategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "book_count"]
    ordering = ["-book_count", "name"]
    pagination_class = None

    def get_queryset(self):
        return (
            Category.objects.select_related("parent")
            .annotate(book_count=Count("book_categories", distinct=True))
            .order_by("-book_count", "name")
        )

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        try:
            category.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Không thể xóa thể loại đang được gắn với sách. "
                        "Hãy chuyển sách sang thể loại khác trước."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class StaffBookUploadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCatalogStaff]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        books = Book.objects.prefetch_related(
            "book_authors__author",
            "book_categories__category",
        ).select_related("publisher")[:20]
        serializer = BookListSerializer(
            books,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = StaffBookUploadSerializer(
            data=request.data,
            context={"request": request},
        )
        if serializer.is_valid():
            book = serializer.save()
            response_serializer = BookDetailSerializer(
                book,
                context={"request": request},
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StaffBookManagementView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCatalogStaff]

    def get_queryset(self):
        return Book.objects.prefetch_related(
            "book_authors__author",
            "book_categories__category",
            "book_series__series",
            "chapters",
            "ebook_files__format_type",
            "reviews__customer__user",
        ).select_related("publisher")

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        status_filter = request.query_params.get("status", "").strip().lower()
        books = self.get_queryset()
        if query:
            books = books.filter(title__icontains=query)
        if status_filter == "active":
            books = books.filter(is_active=True)
        elif status_filter == "inactive":
            books = books.filter(is_active=False)

        serializer = StaffBookManagementSerializer(
            books.order_by("-id"),
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffBookReviewManagementView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCatalogStaff]

    def get_queryset(self):
        return BookReview.objects.select_related(
            "book",
            "customer__user",
        )

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        status_filter = request.query_params.get("status", "").strip().lower()
        rating_filter = request.query_params.get("rating", "").strip()
        reviews = self.get_queryset()

        if query:
            reviews = reviews.filter(
                Q(book__title__icontains=query)
                | Q(title__icontains=query)
                | Q(comment__icontains=query)
                | Q(customer__user__full_name__icontains=query)
                | Q(customer__user__username__icontains=query)
                | Q(customer__user__email__icontains=query)
            )

        valid_statuses = {choice[0] for choice in BookReview.Status.choices}
        if status_filter and status_filter != "all":
            if status_filter not in valid_statuses:
                return Response(
                    {"detail": "Invalid review status."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            reviews = reviews.filter(status=status_filter)

        if rating_filter:
            try:
                rating = int(rating_filter)
            except ValueError:
                rating = None
            if rating:
                reviews = reviews.filter(rating=rating)

        serializer = StaffBookReviewSerializer(
            reviews.order_by("-created_at"),
            many=True,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffBookReviewDetailManagementView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCatalogStaff]

    def get_object(self, pk):
        return BookReview.objects.select_related("book", "customer__user").get(pk=pk)

    def patch(self, request, pk):
        try:
            review = self.get_object(pk)
        except BookReview.DoesNotExist:
            return Response(
                {"detail": "Review not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = StaffBookReviewUpdateSerializer(
            review,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_review = serializer.save()
        response_serializer = StaffBookReviewSerializer(updated_review)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            review = self.get_object(pk)
        except BookReview.DoesNotExist:
            return Response(
                {"detail": "Review not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        review.status = BookReview.Status.DELETED
        review.save(update_fields=["status"])
        serializer = StaffBookReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookReviewReportView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            review = BookReview.objects.select_related("customer__user").get(pk=pk)
        except BookReview.DoesNotExist:
            return Response(
                {"detail": "Review not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        customer = getattr(request.user, "customer", None)
        if customer is None:
            return Response(
                {"detail": "Only customer accounts can report reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if review.customer_id == customer.id:
            return Response(
                {"detail": "Bạn không thể báo cáo đánh giá của chính mình."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if review.status != BookReview.Status.APPROVED:
            return Response(
                {"detail": "Đánh giá này hiện không thể báo cáo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review.status = BookReview.Status.REPORTED
        review.save(update_fields=["status"])
        serializer = BookReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WishlistView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_customer(self, request):
        customer, _ = Customer.objects.get_or_create(user=request.user)
        return customer

    def get(self, request):
        customer = self.get_customer(request)
        wishlist_items = Wishlist.objects.filter(customer=customer).select_related(
            "book",
            "book__publisher",
        )
        book_ids = list(wishlist_items.values_list("book_id", flat=True))
        books = [
            BookListSerializer(item.book, context={"request": request}).data
            for item in wishlist_items
        ]
        return Response(
            {"book_ids": book_ids, "items": books},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        customer = self.get_customer(request)
        book_id = request.data.get("book_id")
        if not book_id:
            return Response(
                {"book_id": "Thiếu thông tin sách."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not Book.objects.filter(pk=book_id).exists():
            return Response(
                {"book_id": "Không tìm thấy sách."},
                status=status.HTTP_404_NOT_FOUND,
            )

        Wishlist.objects.get_or_create(customer=customer, book_id=book_id)
        return Response(
            {"book_id": int(book_id), "is_wishlisted": True},
            status=status.HTTP_201_CREATED,
        )


class WishlistDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, book_id):
        customer, _ = Customer.objects.get_or_create(user=request.user)
        Wishlist.objects.filter(customer=customer, book_id=book_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StaffBookDetailManagementView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsCatalogStaff]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Book.objects.prefetch_related(
            "book_authors__author",
            "book_categories__category",
            "book_series__series",
            "chapters",
            "ebook_files__format_type",
        ).select_related("publisher")

    def get(self, request, pk):
        try:
            book = self.get_queryset().get(pk=pk)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StaffBookManagementSerializer(book, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self._update(request, pk)

    def patch(self, request, pk):
        return self._update(request, pk)

    def _update(self, request, pk):
        try:
            book = self.get_queryset().get(pk=pk)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StaffBookUpdateSerializer(
            book,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            updated_book = serializer.save()
            response_serializer = StaffBookManagementSerializer(
                updated_book,
                context={"request": request},
            )
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            book = self.get_queryset().get(pk=pk)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found."}, status=status.HTTP_404_NOT_FOUND)

        cover_image = book.cover_image
        ebook_files = [ebook_file.file_url for ebook_file in book.ebook_files.all()]

        book.delete()

        if cover_image:
            cover_image.delete(save=False)
        for ebook_file in ebook_files:
            if ebook_file:
                ebook_file.delete(save=False)

        return Response(status=status.HTTP_204_NO_CONTENT)
