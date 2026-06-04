from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentications import JWTAuthentication
from catalog.models import Book

from .models import (
    ReadingProgress,
    UserAnnotation,
    UserBookmark,
    UserLibrary,
    UserLibraryItem,
)
from .serializers import (
    LibraryBookDetailSerializer,
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
        serializer = UserLibrarySerializer(libraries, many=True)
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

        book = Book.objects.prefetch_related(
            "book_authors__author",
            "book_categories__category",
            "book_series__series",
            "chapters",
            "ebook_files__format_type",
        ).select_related("publisher").get(pk=book_id)

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
        })
        return Response(serializer.data)


class ReadingProgressCreateView(APIView):
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

        progress, created = ReadingProgress.objects.update_or_create(
            customer=customer,
            book_id=book_id,
            chapter_id=request.data.get("chapter"),
            defaults={
                "cfi_position": request.data.get("cfi_position", ""),
                "percent_complete": request.data.get("percent_complete", 0),
            },
        )
        serializer = ReadingProgressSerializer(progress)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


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
