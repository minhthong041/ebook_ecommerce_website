import mimetypes
from pathlib import Path

from django.http import FileResponse
from django.utils.text import slugify
from django.db.models import Max
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentications import JWTAuthentication
from catalog.models import Book, BookReview, EbookFile
from catalog.serializers import BookReviewSerializer

from .models import (
    ReadingProgress,
    UserAnnotation,
    UserBookmark,
    UserLibrary,
    UserLibraryItem,
)
from .serializers import (
    LibraryBookDetailSerializer,
    LibraryBookReviewSubmitSerializer,
    ReadingProgressSerializer,
    UserAnnotationSerializer,
    UserBookmarkSerializer,
    UserLibrarySerializer,
)


def _user_owns_book(customer, book_id):
    return UserLibraryItem.objects.filter(
        library__customer=customer, book_id=book_id
    ).exists()


class UserLibraryListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = request.user.customer
        libraries = UserLibrary.objects.filter(customer=customer).prefetch_related(
            "items__book__book_authors__author",
        )
        serializer = UserLibrarySerializer(
            libraries,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class LibraryBookDetailView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        customer = request.user.customer

        if not _user_owns_book(customer, book_id):
            return Response(
                {"detail": "Book not found in your library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            book = Book.objects.prefetch_related(
                "book_authors__author",
                "book_categories__category",
                "book_series__series",
                "chapters",
                "ebook_files__format_type",
            ).select_related("publisher").get(pk=book_id)
        except Book.DoesNotExist:
            return Response(
                {"detail": "Book not found in your library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not book.is_active:
            return Response(
                {"detail": "Sách hiện không khả dụng."},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress = ReadingProgress.objects.filter(
            customer=customer, book_id=book_id
        ).select_related("chapter")

        bookmarks = UserBookmark.objects.filter(
            customer=customer, book_id=book_id
        ).select_related("chapter")

        annotations = UserAnnotation.objects.filter(
            customer=customer, book_id=book_id
        ).select_related("chapter")

        serializer = LibraryBookDetailSerializer({
            "book": book,
            "reading_progress": progress,
            "bookmarks": bookmarks,
            "annotations": annotations,
        }, context={"request": request})
        return Response(serializer.data)


class LibraryBookFileDownloadView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id, file_id):
        customer = request.user.customer

        if not _user_owns_book(customer, book_id):
            return Response(
                {"detail": "Book not found in your library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            ebook_file = EbookFile.objects.select_related(
                "book",
                "format_type",
            ).get(pk=file_id, book_id=book_id)
        except EbookFile.DoesNotExist:
            return Response(
                {"detail": "File not found for this book."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not ebook_file.book.is_active:
            return Response(
                {"detail": "Sách hiện không khả dụng."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not ebook_file.file_url:
            return Response(
                {"detail": "File sách chưa sẵn sàng để tải."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_handle = ebook_file.file_url.open("rb")
        except (FileNotFoundError, OSError, ValueError):
            return Response(
                {"detail": "File sách không tồn tại trên bộ nhớ lưu trữ."},
                status=status.HTTP_404_NOT_FOUND,
            )

        original_name = str(ebook_file.file_url.name or "")
        extension = Path(original_name).suffix.lower()
        slug = slugify(ebook_file.book.title) or f"book-{book_id}"
        format_label = (
            ebook_file.format_type.name.lower()
            if ebook_file.format_type and ebook_file.format_type.name
            else "ebook"
        )
        filename = f"{slug}-{format_label}{extension}"
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        response = FileResponse(
            file_handle,
            as_attachment=True,
            filename=filename,
            content_type=content_type,
        )
        response["X-Readify-File-Format"] = format_label.upper()
        return response


class ReadingProgressCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user.customer
        book_id = request.data.get("book")
        chapter_id = request.data.get("chapter") or None
        try:
            percent_complete = float(request.data.get("percent_complete", 0))
        except (TypeError, ValueError):
            percent_complete = 0
        percent_complete = max(0, min(percent_complete, 100))

        if not _user_owns_book(customer, book_id):
            return Response(
                {"detail": "Book not found in your library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        progress = ReadingProgress.objects.filter(
            customer=customer,
            book_id=book_id,
            chapter_id=chapter_id,
        ).first()

        if progress:
            current_percent = float(progress.percent_complete or 0)
            if percent_complete >= current_percent:
                progress.percent_complete = percent_complete
                progress.cfi_position = request.data.get("cfi_position", "")
                progress.save(update_fields=["percent_complete", "cfi_position", "updated_at"])
            created = False
        else:
            progress = ReadingProgress.objects.create(
                customer=customer,
                book_id=book_id,
                chapter_id=chapter_id,
                cfi_position=request.data.get("cfi_position", ""),
                percent_complete=percent_complete,
            )
            created = True

        serializer = ReadingProgressSerializer(progress)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class BookReviewCreateUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user.customer
        book_id = request.data.get("book")

        if not _user_owns_book(customer, book_id):
            return Response(
                {"detail": "Bạn cần mua sách trước khi đánh giá."},
                status=status.HTTP_403_FORBIDDEN,
            )

        max_progress = (
            ReadingProgress.objects.filter(customer=customer, book_id=book_id)
            .aggregate(max_progress=Max("percent_complete"))
            .get("max_progress")
        )
        if float(max_progress or 0) < 10:
            return Response(
                {"detail": "Bạn cần đọc ít nhất 10% sách trước khi đánh giá."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = LibraryBookReviewSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review = BookReview.objects.filter(customer=customer, book_id=book_id).first()
        created = review is None
        if review is None:
            review = BookReview(customer=customer, book_id=book_id)

        review.rating = serializer.validated_data["rating"]
        review.title = serializer.validated_data.get("title", "")
        review.comment = serializer.validated_data.get("comment", "")
        review.is_purchased = True
        review.status = BookReview.Status.PENDING
        review.save()

        response_serializer = BookReviewSerializer(review)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        customer = request.user.customer
        try:
            review = BookReview.objects.get(pk=pk, customer=customer)
        except BookReview.DoesNotExist:
            return Response(
                {"detail": "Review not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        review.status = BookReview.Status.DELETED
        review.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserBookmarkCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user.customer
        book_id = request.data.get("book")

        if not _user_owns_book(customer, book_id):
            return Response(
                {"detail": "Book not found in your library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserBookmarkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAnnotationCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        customer = request.user.customer
        book_id = request.data.get("book")

        if not _user_owns_book(customer, book_id):
            return Response(
                {"detail": "Book not found in your library."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UserAnnotationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(customer=customer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
