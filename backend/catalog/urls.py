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
    path("", include(router.urls)),
]
