from django.urls import path

from . import views

urlpatterns = [
    path("library/", views.UserLibraryListView.as_view(), name="user-library-list"),
    path("library/books/<int:book_id>/", views.LibraryBookDetailView.as_view(), name="library-book-detail"),
    path("reading-progress/", views.ReadingProgressCreateView.as_view(), name="reading-progress-create"),
    path("book-reviews/", views.BookReviewCreateUpdateView.as_view(), name="book-review-create-update"),
    path("book-reviews/<int:pk>/", views.BookReviewCreateUpdateView.as_view(), name="book-review-delete"),
    path("bookmarks/", views.UserBookmarkCreateView.as_view(), name="bookmark-create"),
    path("annotations/", views.UserAnnotationCreateView.as_view(), name="annotation-create"),
]
