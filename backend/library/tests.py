import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from catalog.models import Book, EbookFile, FormatType, Publisher
from library.models import UserLibrary, UserLibraryItem


TEMP_MEDIA_ROOT = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class LibraryBookFileDownloadTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="reader",
            email="reader@example.com",
            password="password123",
            full_name="Reader",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="password123",
            full_name="Other Reader",
        )
        self.publisher = Publisher.objects.create(name="Readify Press")
        self.book = Book.objects.create(
            title="Readable Ebook",
            publisher=self.publisher,
            price=79000,
            is_active=True,
        )
        self.format_type = FormatType.objects.create(name="PDF")
        self.ebook_file = EbookFile.objects.create(
            book=self.book,
            format_type=self.format_type,
            file_url=SimpleUploadedFile(
                "readable-ebook.pdf",
                b"PDF content",
                content_type="application/pdf",
            ),
            file_size_bytes=11,
        )
        self.library = UserLibrary.objects.create(
            customer=self.user.customer,
            name="My Library",
        )
        UserLibraryItem.objects.create(
            library=self.library,
            book=self.book,
        )
        self.client = APIClient()

    def download_url(self):
        return (
            f"/api/library/books/{self.book.id}/files/"
            f"{self.ebook_file.id}/download/"
        )

    def test_owner_can_download_owned_book_file(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.download_url())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment", response["Content-Disposition"])

    def test_user_cannot_download_file_for_unowned_book(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.get(self.download_url())

        self.assertEqual(response.status_code, 404)

    def test_inactive_owned_book_file_download_is_blocked(self):
        self.book.is_active = False
        self.book.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.download_url())

        self.assertEqual(response.status_code, 403)
