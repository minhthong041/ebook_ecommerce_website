from django.urls import path

from . import views

urlpatterns = [
    path("library/", views.UserLibraryListView.as_view(), name="user-library-list"),
    path("library/books/<int:book_id>/", views.LibraryBookDetailView.as_view(), name="library-book-detail"),
    path("reading-progress/", views.ReadingProgressCreateView.as_view(), name="reading-progress-create"),
    path("bookmarks/", views.UserBookmarkCreateView.as_view(), name="bookmark-create"),
    path("annotations/", views.UserAnnotationCreateView.as_view(), name="annotation-create"),
]
