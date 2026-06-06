from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"books", views.BookViewSet, basename="book")
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"authors", views.AuthorViewSet, basename="author")
router.register(r"publishers", views.PublisherViewSet, basename="publisher")
router.register(r"format-types", views.FormatTypeViewSet, basename="format-type")
router.register(r"series", views.SeriesViewSet, basename="series")

urlpatterns = [
    path("wishlists/", views.WishlistView.as_view(), name="wishlist"),
    path("wishlists/<int:book_id>/", views.WishlistDetailView.as_view(), name="wishlist-detail"),
    path("staff/books/", views.StaffBookManagementView.as_view(), name="staff-book-management"),
    path("staff/books/<int:pk>/", views.StaffBookDetailManagementView.as_view(), name="staff-book-detail-management"),
    path("staff/books/upload/", views.StaffBookUploadView.as_view(), name="staff-book-upload"),
    path("staff/reviews/", views.StaffBookReviewManagementView.as_view(), name="staff-review-management"),
    path("staff/reviews/<int:pk>/", views.StaffBookReviewDetailManagementView.as_view(), name="staff-review-detail-management"),
    path("book-reviews/<int:pk>/report/", views.BookReviewReportView.as_view(), name="book-review-report"),
    path("", include(router.urls)),
]
