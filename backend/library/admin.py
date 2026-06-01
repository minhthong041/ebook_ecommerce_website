from django.contrib import admin

from .models import (
    ReaderSetting,
    ReadingProgress,
    UserAnnotation,
    UserBookmark,
    UserLibrary,
    UserLibraryItem,
)


class UserLibraryItemInline(admin.TabularInline):
    model = UserLibraryItem
    extra = 0
    autocomplete_fields = ("book",)


@admin.register(UserLibrary)
class UserLibraryAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "name", "created_at")
    search_fields = ("customer__user__username", "customer__user__email", "name")
    autocomplete_fields = ("customer",)
    inlines = (UserLibraryItemInline,)


@admin.register(UserLibraryItem)
class UserLibraryItemAdmin(admin.ModelAdmin):
    list_display = ("id", "library", "book", "acquired_date")
    search_fields = ("library__name", "book__title")
    autocomplete_fields = ("library", "book")


@admin.register(ReaderSetting)
class ReaderSettingAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "updated_at")
    search_fields = ("customer__user__username", "customer__user__email")
    autocomplete_fields = ("customer",)


@admin.register(UserBookmark)
class UserBookmarkAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "book", "chapter", "label", "created_at")
    search_fields = ("customer__user__username", "book__title", "label")
    autocomplete_fields = ("customer", "book", "chapter")


@admin.register(UserAnnotation)
class UserAnnotationAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "book", "chapter", "color_code", "created_at")
    search_fields = ("customer__user__username", "book__title", "selected_text")
    autocomplete_fields = ("customer", "book", "chapter")


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "book", "chapter", "percent_complete", "updated_at")
    search_fields = ("customer__user__username", "book__title")
    autocomplete_fields = ("customer", "book", "chapter")
