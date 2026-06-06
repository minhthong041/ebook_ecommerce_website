import html
import re
import zipfile
from pathlib import Path

from pypdf import PdfReader


MAX_READER_CHARS = 450_000
PDF_PAGES_PER_CHAPTER = 5
MIN_CHAPTER_CHARS = 40


def build_book_reader_payload(book, char_limit=MAX_READER_CHARS):
    """Extract readable chapter payload from the uploaded ebook file."""
    ebook_files = list(book.ebook_files.select_related("format_type").all())
    for format_name in ("EPUB", "PDF"):
        ebook_file = _find_ebook_file(ebook_files, format_name)
        if not ebook_file:
            continue

        payload = extract_ebook_reader_payload(ebook_file, char_limit=char_limit)
        if payload["chapters"]:
            return {
                "source_format": format_name,
                "chapters": payload["chapters"],
                "is_truncated": payload["is_truncated"],
                "message": "",
            }

    unsupported_formats = [
        ebook_file.format_type.name
        for ebook_file in ebook_files
        if ebook_file.format_type.name.upper() not in {"EPUB", "PDF"}
    ]
    if unsupported_formats:
        message = "Đọc trực tiếp hiện hỗ trợ tốt nhất cho EPUB và PDF."
    else:
        message = "Không thể trích xuất nội dung đọc từ file ebook đã upload."

    return {
        "source_format": "",
        "chapters": [],
        "is_truncated": False,
        "message": message,
    }


def extract_ebook_reader_payload(ebook_file, char_limit=MAX_READER_CHARS):
    try:
        file_path = Path(ebook_file.file_url.path)
    except (NotImplementedError, ValueError):
        return _empty_payload()

    if not file_path.exists():
        return _empty_payload()

    extension = file_path.suffix.lower()
    try:
        if extension == ".epub":
            return _extract_epub_reader_payload(file_path, char_limit)
        if extension == ".pdf":
            return _extract_pdf_reader_payload(file_path, char_limit)
    except Exception:
        return _empty_payload()

    return _empty_payload()


def _empty_payload():
    return {
        "chapters": [],
        "is_truncated": False,
    }


def _find_ebook_file(ebook_files, format_name):
    normalized_format = format_name.lower()
    for ebook_file in ebook_files:
        if ebook_file.format_type.name.lower() == normalized_format:
            return ebook_file
    return None


def _extract_pdf_reader_payload(file_path, char_limit):
    reader = PdfReader(str(file_path))
    chapters = []
    current_text = []
    current_start_page = 1
    consumed_chars = 0
    is_truncated = False

    for index, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        current_text.append(page_text)

        should_flush = index % PDF_PAGES_PER_CHAPTER == 0 or index == len(reader.pages)
        if not should_flush:
            continue

        chapter_text = "\n\n".join(current_text)
        remaining_chars = char_limit - consumed_chars
        if remaining_chars <= 0:
            is_truncated = True
            break

        if len(chapter_text) > remaining_chars:
            chapter_text = chapter_text[:remaining_chars]
            is_truncated = True

        paragraphs = _text_to_paragraphs(chapter_text)
        if paragraphs:
            chapters.append(
                _build_chapter(
                    chapter_id=f"pdf-{len(chapters) + 1}",
                    title=_build_pdf_chapter_title(current_start_page, index),
                    order_index=len(chapters) + 1,
                    paragraphs=paragraphs,
                )
            )
            consumed_chars += sum(len(paragraph) for paragraph in paragraphs)

        if is_truncated:
            break

        current_text = []
        current_start_page = index + 1

    return {
        "chapters": chapters,
        "is_truncated": is_truncated,
    }


def _extract_epub_reader_payload(file_path, char_limit):
    chapters = []
    consumed_chars = 0
    is_truncated = False

    with zipfile.ZipFile(file_path) as epub_zip:
        content_files = [
            name
            for name in epub_zip.namelist()
            if name.lower().endswith((".xhtml", ".html", ".htm"))
            and not _is_epub_navigation_file(name)
        ]

        for content_file in sorted(content_files):
            raw_content = epub_zip.read(content_file).decode("utf-8", errors="ignore")
            title = _extract_html_title(raw_content) or f"Phần {len(chapters) + 1}"
            text = _html_to_text(raw_content)

            remaining_chars = char_limit - consumed_chars
            if remaining_chars <= 0:
                is_truncated = True
                break

            if len(text) > remaining_chars:
                text = text[:remaining_chars]
                is_truncated = True

            paragraphs = _text_to_paragraphs(text)
            if sum(len(paragraph) for paragraph in paragraphs) >= MIN_CHAPTER_CHARS:
                chapters.append(
                    _build_chapter(
                        chapter_id=f"epub-{len(chapters) + 1}",
                        title=title,
                        order_index=len(chapters) + 1,
                        paragraphs=paragraphs,
                    )
                )
                consumed_chars += sum(len(paragraph) for paragraph in paragraphs)

            if is_truncated:
                break

    return {
        "chapters": chapters,
        "is_truncated": is_truncated,
    }


def _build_chapter(chapter_id, title, order_index, paragraphs):
    return {
        "id": chapter_id,
        "title": _clean_inline_text(title),
        "order_index": order_index,
        "paragraphs": paragraphs,
        "character_count": sum(len(paragraph) for paragraph in paragraphs),
    }


def _build_pdf_chapter_title(start_page, end_page):
    if start_page == end_page:
        return f"Trang {start_page}"
    return f"Trang {start_page}-{end_page}"


def _is_epub_navigation_file(file_name):
    normalized = file_name.lower()
    return any(
        part in normalized
        for part in (
            "nav.",
            "toc.",
            "cover.",
            "copyright.",
            "titlepage.",
        )
    )


def _extract_html_title(raw_content):
    for pattern in (
        r"<h1\b[^>]*>(.*?)</h1>",
        r"<h2\b[^>]*>(.*?)</h2>",
        r"<title\b[^>]*>(.*?)</title>",
    ):
        match = re.search(pattern, raw_content, flags=re.IGNORECASE | re.DOTALL)
        if match:
            return _html_to_text(match.group(1))
    return ""


def _html_to_text(raw_content):
    without_scripts = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        " ",
        raw_content,
        flags=re.IGNORECASE | re.DOTALL,
    )
    with_block_breaks = re.sub(
        r"</?(p|div|section|article|br|li|h[1-6]|blockquote|tr)\b[^>]*>",
        "\n\n",
        without_scripts,
        flags=re.IGNORECASE,
    )
    without_tags = re.sub(r"<[^>]+>", " ", with_block_breaks)
    return html.unescape(without_tags)


def _text_to_paragraphs(text):
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    raw_paragraphs = re.split(r"\n\s*\n+", normalized)
    paragraphs = []

    for raw_paragraph in raw_paragraphs:
        paragraph = _clean_inline_text(raw_paragraph)
        if not paragraph:
            continue
        paragraphs.extend(_split_long_paragraph(paragraph))

    return paragraphs


def _split_long_paragraph(paragraph, max_chars=1300):
    if len(paragraph) <= max_chars:
        return [paragraph]

    parts = []
    remaining = paragraph
    while len(remaining) > max_chars:
        split_at = remaining.rfind(". ", 0, max_chars)
        if split_at < max_chars // 2:
            split_at = remaining.rfind(" ", 0, max_chars)
        if split_at < max_chars // 2:
            split_at = max_chars

        parts.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].strip()

    if remaining:
        parts.append(remaining)

    return parts


def _clean_inline_text(text):
    return re.sub(r"\s+", " ", text).strip()
