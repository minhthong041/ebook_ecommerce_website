import html
import re
import zipfile
from pathlib import Path

from pypdf import PdfReader


PREVIEW_CHAR_LIMIT = 1200


def build_book_preview(book, char_limit=PREVIEW_CHAR_LIMIT):
    """Return a short preview extracted from an uploaded ebook file."""
    ebook_files = list(book.ebook_files.select_related("format_type").all())
    for format_name in ("EPUB", "PDF"):
        ebook_file = _find_ebook_file(ebook_files, format_name)
        if not ebook_file:
            continue

        preview_text = extract_ebook_preview(ebook_file, char_limit=char_limit)
        if preview_text:
            return {
                "text": preview_text,
                "source_format": format_name,
            }

    return {
        "text": "",
        "source_format": "",
    }


def extract_ebook_preview(ebook_file, char_limit=PREVIEW_CHAR_LIMIT):
    try:
        file_path = Path(ebook_file.file_url.path)
    except (NotImplementedError, ValueError):
        return ""

    if not file_path.exists():
        return ""

    extension = file_path.suffix.lower()
    try:
        if extension == ".epub":
            return _extract_epub_preview(file_path, char_limit)
        if extension == ".pdf":
            return _extract_pdf_preview(file_path, char_limit)
    except Exception:
        return ""

    return ""


def _find_ebook_file(ebook_files, format_name):
    normalized_format = format_name.lower()
    for ebook_file in ebook_files:
        if ebook_file.format_type.name.lower() == normalized_format:
            return ebook_file
    return None


def _extract_pdf_preview(file_path, char_limit):
    reader = PdfReader(str(file_path))
    text_parts = []
    for page in reader.pages[:5]:
        text_parts.append(page.extract_text() or "")
        if len(" ".join(text_parts)) >= char_limit:
            break
    return _clean_preview_text(" ".join(text_parts), char_limit)


def _extract_epub_preview(file_path, char_limit):
    text_parts = []
    with zipfile.ZipFile(file_path) as epub_zip:
        content_files = sorted(
            name
            for name in epub_zip.namelist()
            if name.lower().endswith((".xhtml", ".html", ".htm"))
        )
        for content_file in content_files[:12]:
            raw_content = epub_zip.read(content_file).decode("utf-8", errors="ignore")
            text_parts.append(_html_to_text(raw_content))
            if len(" ".join(text_parts)) >= char_limit:
                break
    return _clean_preview_text(" ".join(text_parts), char_limit)


def _html_to_text(raw_content):
    without_scripts = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        " ",
        raw_content,
        flags=re.IGNORECASE | re.DOTALL,
    )
    without_tags = re.sub(r"<[^>]+>", " ", without_scripts)
    return html.unescape(without_tags)


def _clean_preview_text(text, char_limit):
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return ""
    if len(normalized) <= char_limit:
        return normalized

    trimmed = normalized[:char_limit].rsplit(" ", 1)[0].strip()
    return f"{trimmed}..."
