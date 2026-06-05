import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { BOOKS } from "../../data/bookData";
import "./ReaderPage.css";

const THEMES = [
  { id: "light", name: "Sáng", class: "reader-theme--light" },
  { id: "sepia", name: "Sepia", class: "reader-theme--sepia" },
  { id: "dark", name: "Tối", class: "reader-theme--dark" },
];

const FONTS = [
  {
    id: "serif",
    name: "Có chân (Serif)",
    family: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "sans-serif",
    name: "Không chân (Sans-Serif)",
    family: "'Inter', -apple-system, sans-serif",
  },
];

const FONT_SIZES = [
  { id: "small", name: "A-", size: "0.95rem" },
  { id: "medium", name: "A", size: "1.1rem" },
  { id: "large", name: "A+", size: "1.3rem" },
  { id: "xlarge", name: "A++", size: "1.5rem" },
];

const createId = () => Date.now();

export default function ReaderPage() {
  const { id } = useParams();
  const bookId = Number(id);

  // 1. Load book data
  const book = useMemo(() => BOOKS.find((b) => b.id === bookId), [bookId]);

  // 2. States
  const [activeChapterIndex, setActiveChapterIndex] = useState(() => {
    const savedProgress = localStorage.getItem(`reader_progress_${bookId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        return progress.chapterIndex ?? 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("toc"); // toc, settings, annotations

  // Reading preferences (loaded from localStorage if exists)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("reader_preferences");
    return saved
      ? JSON.parse(saved)
      : {
          theme: "sepia",
          fontFamily: "serif",
          fontSize: "medium",
        };
  });

  // Annotations (highlights & notes) & Bookmarks loaded from localStorage
  const [annotations, setAnnotations] = useState(() => {
    const saved = localStorage.getItem(`reader_annotations_${bookId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem(`reader_bookmarks_${bookId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic selection tooltip state
  const [selectionData, setSelectionData] = useState(null); // { text, paragraphIndex, coords: {top, left} }
  const [showTooltip, setShowTooltip] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] =
    useState("yellow");

  // Selected annotation details for view/delete modal
  const [viewingAnnotation, setViewingAnnotation] = useState(null);

  const contentRef = useRef(null);

  // 3. Effects
  useEffect(() => {
    localStorage.setItem("reader_preferences", JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(
      `reader_annotations_${bookId}`,
      JSON.stringify(annotations),
    );
  }, [annotations, bookId]);

  useEffect(() => {
    localStorage.setItem(
      `reader_bookmarks_${bookId}`,
      JSON.stringify(bookmarks),
    );
  }, [bookmarks, bookId]);

  // Load last read chapter from progress tracking is handled by the activeChapterIndex initializer above.

  // Save current progress on chapter change
  const handleChapterChange = (index) => {
    setActiveChapterIndex(index);
    localStorage.setItem(
      `reader_progress_${bookId}`,
      JSON.stringify({
        chapterIndex: index,
        updatedAt: new Date().toISOString(),
      }),
    );
    // Scroll content back to top
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Close tooltip
    setShowTooltip(false);
  };

  // 4. Generate dynamic chapter content
  const activeChapter = useMemo(() => {
    return (
      book?.tableOfContents?.[activeChapterIndex] ||
      book?.tableOfContents?.[0] ||
      null
    );
  }, [book, activeChapterIndex]);

  const chapterParagraphs = useMemo(() => {
    if (!activeChapter || !book) {
      return [];
    }

    return [
      `Chào mừng bạn đến với chương "${activeChapter.title}" của cuốn sách "${book.title}". Đây là phần nội dung được hiển thị dưới dạng bản dùng thử mô phỏng trải nghiệm đọc sách thực tế trên BookVerse.`,
      `Trong phần này, tác giả ${book.author} sẽ dẫn dắt chúng ta đi qua những góc nhìn độc đáo liên quan đến đề tài này. Bằng việc kết hợp giữa lý luận lý thuyết và các nghiên cứu điển hình trực quan, người đọc sẽ dễ dàng kết nối lý thuyết vào thực tiễn cuộc sống.`,
      `Để tối ưu hóa trải nghiệm đọc sách của riêng bạn, hãy sử dụng bảng điều khiển tùy chọn ở góc bên trái. Bạn có thể tự do thay đổi kích thước chữ (Font Size), thay đổi kiểu phông chữ Serif hoặc Sans-serif và chuyển đổi các chế độ màu nền (Sáng, Tối, Sepia) giúp chống mỏi mắt hiệu quả.`,
      `Đặc biệt, hệ thống đọc sách thông minh này cho phép bạn tương tác trực tiếp với văn bản. Hãy thử bôi đen bất kỳ đoạn văn bản nào trên màn hình này: một thanh công cụ tô màu (Highlighter) sẽ hiện lên ngay lập tức. Bạn có thể đánh dấu bằng nhiều màu sắc sinh động, hoặc thêm các dòng ghi chú (Notes) để lưu trữ suy nghĩ cá nhân của mình.`,
      `Tất cả các dòng đánh dấu nổi bật và ghi chú này sẽ được tự động tổng hợp đầy đủ trong tab "Đánh dấu & Note" bên trái để bạn dễ dàng quản lý và ôn tập bất cứ lúc nào. Chúc bạn có một hành trình đọc sách thật thú vị và thu hoạch được nhiều kiến thức bổ ích cùng BookVerse!`,
    ];
  }, [activeChapter, book]);

  if (!book) {
    return (
      <div className="reader-error">
        <h2>Không tìm thấy sách</h2>
        <p>Cuốn sách bạn yêu cầu không tồn tại hoặc chưa được mua.</p>
        <Link to="/library" className="btn btn-primary">
          Quay lại Thư viện
        </Link>
      </div>
    );
  }

  // 5. Handling Text Selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      try {
        const range = selection.getRangeAt(0);

        // Ensure the selection is within our reading content pane
        let node = range.startContainer;
        let isWithinContent = false;
        while (node) {
          if (node === contentRef.current) {
            isWithinContent = true;
            break;
          }
          node = node.parentNode;
        }

        if (!isWithinContent) return;

        // Find the closest paragraph element to retrieve paragraphIndex
        let pNode = range.startContainer;
        while (pNode && pNode.nodeName !== "P") {
          pNode = pNode.parentNode;
        }

        if (pNode && pNode.hasAttribute("data-index")) {
          const paragraphIndex = parseInt(pNode.getAttribute("data-index"), 10);
          const rect = range.getBoundingClientRect();
          const contentRect = contentRef.current.getBoundingClientRect();

          // Position relative to the main container
          setSelectionData({
            text: selectedText,
            paragraphIndex: paragraphIndex,
            coords: {
              top:
                rect.top - contentRect.top + contentRef.current.scrollTop - 48,
              left: rect.left - contentRect.left + rect.width / 2,
            },
          });
          setShowTooltip(true);
        }
      } catch (err) {
        console.error("Lỗi khi lấy vùng chọn text:", err);
      }
    } else {
      if (!showNoteForm) {
        setShowTooltip(false);
      }
    }
  };

  const handleAddHighlight = (color) => {
    if (!selectionData) return;

    const newAnnotation = {
      id: createId(),
      chapterIndex: activeChapterIndex,
      chapterTitle: activeChapter.title,
      paragraphIndex: selectionData.paragraphIndex,
      selectedText: selectionData.text,
      color: color,
      note: "",
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    clearSelection();
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!selectionData || !noteText.trim()) return;

    const newAnnotation = {
      id: createId(),
      chapterIndex: activeChapterIndex,
      chapterTitle: activeChapter.title,
      paragraphIndex: selectionData.paragraphIndex,
      selectedText: selectionData.text,
      color: selectedHighlightColor,
      note: noteText.trim(),
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setNoteText("");
    setShowNoteForm(false);
    clearSelection();
  };

  const clearSelection = () => {
    window.getSelection().removeAllRanges();
    setSelectionData(null);
    setShowTooltip(false);
    setShowNoteForm(false);
  };

  const handleDeleteAnnotation = (id) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    setViewingAnnotation(null);
  };

  // 6. Handle Bookmarks
  const isCurrentChapterBookmarked = bookmarks.some(
    (b) => b.chapterIndex === activeChapterIndex,
  );

  const toggleBookmark = () => {
    if (isCurrentChapterBookmarked) {
      setBookmarks((prev) =>
        prev.filter((b) => b.chapterIndex !== activeChapterIndex),
      );
    } else {
      const newBookmark = {
        id: createId(),
        chapterIndex: activeChapterIndex,
        chapterTitle: activeChapter.title,
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      setBookmarks((prev) => [...prev, newBookmark]);
    }
  };

  // 7. Render Paragraphs with Inline Highlights
  const renderParagraph = (text, paragraphIndex) => {
    const paragraphAnnotations = annotations.filter(
      (ann) =>
        ann.chapterIndex === activeChapterIndex &&
        ann.paragraphIndex === paragraphIndex,
    );

    if (paragraphAnnotations.length === 0) {
      return (
        <p
          key={paragraphIndex}
          data-index={paragraphIndex}
          className="reader-paragraph"
        >
          {text}
        </p>
      );
    }

    // Find all matches in paragraph text and sort them
    let segments = [];
    let currentIndex = 0;

    // Find occurrences for each highlight in the text
    const matches = paragraphAnnotations
      .map((ann) => {
        const index = text.indexOf(ann.selectedText);
        return { ...ann, startIndex: index };
      })
      .filter((m) => m.startIndex !== -1)
      .sort((a, b) => a.startIndex - b.startIndex);

    // Filter overlapping annotations just in case
    const nonOverlappingMatches = [];
    let lastEnd = 0;
    for (const match of matches) {
      if (match.startIndex >= lastEnd) {
        nonOverlappingMatches.push(match);
        lastEnd = match.startIndex + match.selectedText.length;
      }
    }

    // Slice text and insert spans
    for (const match of nonOverlappingMatches) {
      if (match.startIndex > currentIndex) {
        segments.push(text.slice(currentIndex, match.startIndex));
      }
      segments.push(
        <span
          key={match.id}
          className={`reader-highlight-span reader-highlight-span--${match.color}`}
          onClick={() => setViewingAnnotation(match)}
        >
          {match.selectedText}
          {match.note && <span className="reader-note-indicator">💬</span>}
        </span>,
      );
      currentIndex = match.startIndex + match.selectedText.length;
    }

    if (currentIndex < text.length) {
      segments.push(text.slice(currentIndex));
    }

    return (
      <p
        key={paragraphIndex}
        data-index={paragraphIndex}
        className="reader-paragraph"
      >
        {segments}
      </p>
    );
  };

  // Get current preferences styling
  const activeThemeClass =
    THEMES.find((t) => t.id === preferences.theme)?.class ||
    "reader-theme--sepia";
  const activeFontFamily =
    FONTS.find((f) => f.id === preferences.fontFamily)?.family || "serif";
  const activeFontSizeValue =
    FONT_SIZES.find((s) => s.id === preferences.fontSize)?.size || "1.1rem";

  return (
    <div className={`reader-container ${activeThemeClass}`}>
      {/* HEADER */}
      <header className="reader-header">
        <div className="reader-header__left">
          <Link
            to="/library"
            className="reader-back-btn"
            title="Quay lại thư viện"
          >
            ‹ Thư viện
          </Link>
          <div className="reader-header__divider" />
          <h2 className="reader-header__book-title">{book.title}</h2>
        </div>
        <div className="reader-header__center">
          <span className="reader-header__chapter-title">
            {activeChapter.title}
          </span>
        </div>
        <div className="reader-header__right">
          <button
            onClick={toggleBookmark}
            className={`reader-icon-btn reader-bookmark-btn ${isCurrentChapterBookmarked ? "reader-bookmark-btn--active" : ""}`}
            title={
              isCurrentChapterBookmarked
                ? "Bỏ đánh dấu chương này"
                : "Đánh dấu chương này"
            }
          >
            🔖
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`reader-icon-btn reader-sidebar-toggle-btn ${sidebarOpen ? "reader-sidebar-toggle-btn--active" : ""}`}
            title="Đóng/Mở thanh công cụ"
          >
            ⚙️ Menu
          </button>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="reader-body">
        {/* SIDEBAR */}
        <aside
          className={`reader-sidebar ${sidebarOpen ? "reader-sidebar--open" : ""}`}
        >
          <div className="reader-sidebar__tabs">
            <button
              onClick={() => setActiveTab("toc")}
              className={`reader-sidebar__tab ${activeTab === "toc" ? "reader-sidebar__tab--active" : ""}`}
            >
              Mục lục
            </button>
            <button
              onClick={() => setActiveTab("annotations")}
              className={`reader-sidebar__tab ${activeTab === "annotations" ? "reader-sidebar__tab--active" : ""}`}
            >
              Note & Highlight
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`reader-sidebar__tab ${activeTab === "settings" ? "reader-sidebar__tab--active" : ""}`}
            >
              Cài đặt
            </button>
          </div>

          <div className="reader-sidebar__content">
            {/* TAB: TABLE OF CONTENTS */}
            {activeTab === "toc" && (
              <div className="reader-toc">
                <h3 className="reader-sidebar__title">Danh sách chương</h3>
                <ul className="reader-toc__list">
                  {book.tableOfContents.map((chap, idx) => (
                    <li key={idx} className="reader-toc__item">
                      <button
                        onClick={() => handleChapterChange(idx)}
                        className={`reader-toc__btn ${idx === activeChapterIndex ? "reader-toc__btn--active" : ""}`}
                      >
                        <span className="reader-toc__number">{idx + 1}.</span>
                        <span className="reader-toc__title-text">
                          {chap.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAB: ANNOTATIONS & BOOKMARKS */}
            {activeTab === "annotations" && (
              <div className="reader-annotations">
                <div className="reader-annotations__section">
                  <h3 className="reader-sidebar__title">
                    Đã đánh dấu chương ({bookmarks.length})
                  </h3>
                  {bookmarks.length === 0 ? (
                    <p className="reader-sidebar__empty-text">
                      Chưa có chương nào được đánh dấu.
                    </p>
                  ) : (
                    <ul className="reader-bookmarks__list">
                      {bookmarks.map((b) => (
                        <li key={b.id} className="reader-bookmarks__item">
                          <button
                            onClick={() => handleChapterChange(b.chapterIndex)}
                            className="reader-bookmarks__btn"
                          >
                            <span>
                              📌 Chapter {b.chapterIndex + 1}: {b.chapterTitle}
                            </span>
                            <span className="reader-bookmarks__date">
                              {b.createdAt}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="reader-annotations__section">
                  <h3 className="reader-sidebar__title">
                    Highlights & Ghi chú ({annotations.length})
                  </h3>
                  {annotations.length === 0 ? (
                    <p className="reader-sidebar__empty-text">
                      Bôi đen văn bản để highlight hoặc thêm ghi chú.
                    </p>
                  ) : (
                    <ul className="reader-notes__list">
                      {annotations.map((ann) => (
                        <li
                          key={ann.id}
                          className={`reader-notes__item reader-notes__item--border-${ann.color}`}
                        >
                          <div
                            className="reader-notes__quote"
                            onClick={() =>
                              handleChapterChange(ann.chapterIndex)
                            }
                            title="Đi tới chương chứa ghi chú này"
                          >
                            "{ann.selectedText}"
                          </div>
                          {ann.note && (
                            <div className="reader-notes__comment">
                              💬 {ann.note}
                            </div>
                          )}
                          <div className="reader-notes__footer">
                            <span className="reader-notes__location">
                              Chương {ann.chapterIndex + 1}
                            </span>
                            <button
                              onClick={() => handleDeleteAnnotation(ann.id)}
                              className="reader-notes__delete-btn"
                            >
                              Xóa
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <div className="reader-settings">
                <h3 className="reader-sidebar__title">
                  Tùy biến không gian đọc
                </h3>

                {/* Theme Selector */}
                <div className="reader-settings__group">
                  <label className="reader-settings__label">
                    Màu nền trang sách
                  </label>
                  <div className="reader-settings__theme-grid">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            theme: theme.id,
                          }))
                        }
                        className={`reader-settings__theme-btn reader-settings__theme-btn--${theme.id} ${preferences.theme === theme.id ? "reader-settings__theme-btn--active" : ""}`}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Selector */}
                <div className="reader-settings__group">
                  <label className="reader-settings__label">Phông chữ</label>
                  <div className="reader-settings__font-list">
                    {FONTS.map((font) => (
                      <button
                        key={font.id}
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            fontFamily: font.id,
                          }))
                        }
                        className={`reader-settings__font-btn ${preferences.fontFamily === font.id ? "reader-settings__font-btn--active" : ""}`}
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Selector */}
                <div className="reader-settings__group">
                  <label className="reader-settings__label">
                    Cỡ chữ hiển thị
                  </label>
                  <div className="reader-settings__size-list">
                    {FONT_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            fontSize: size.id,
                          }))
                        }
                        className={`reader-settings__size-btn ${preferences.fontSize === size.id ? "reader-settings__size-btn--active" : ""}`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN READING PANE */}
        <main
          className="reader-main-pane"
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
        >
          <div
            ref={contentRef}
            className="reader-content-viewport"
            style={{
              fontFamily: activeFontFamily,
              fontSize: activeFontSizeValue,
            }}
          >
            <div className="reader-content-body">
              <span className="reader-chapter-indicator">
                Chương {activeChapterIndex + 1}
              </span>
              <h1 className="reader-chapter-title-main">
                {activeChapter.title}
              </h1>
              <div className="reader-chapter-separator" />

              <div className="reader-paragraphs-container">
                {chapterParagraphs.map((text, idx) =>
                  renderParagraph(text, idx),
                )}
              </div>

              {/* Navigation buttons at bottom of content */}
              <div className="reader-page-nav">
                <button
                  onClick={() => handleChapterChange(activeChapterIndex - 1)}
                  disabled={activeChapterIndex === 0}
                  className="btn btn-ghost reader-nav-btn"
                >
                  ← Chương trước
                </button>
                <span className="reader-nav-progress">
                  Chương {activeChapterIndex + 1} /{" "}
                  {book.tableOfContents.length}
                </span>
                <button
                  onClick={() => handleChapterChange(activeChapterIndex + 1)}
                  disabled={
                    activeChapterIndex === book.tableOfContents.length - 1
                  }
                  className="btn btn-primary reader-nav-btn"
                >
                  Chương sau →
                </button>
              </div>
            </div>
          </div>

          {/* TEXT SELECTION TOOLTIP */}
          {showTooltip && selectionData && (
            <div
              className="reader-selection-tooltip"
              style={{
                top: `${selectionData.coords.top}px`,
                left: `${selectionData.coords.left}px`,
              }}
            >
              {!showNoteForm ? (
                <div className="reader-tooltip__actions">
                  <button
                    onClick={() => handleAddHighlight("yellow")}
                    className="reader-tooltip__color-btn reader-tooltip__color-btn--yellow"
                    title="Tô màu vàng"
                  />
                  <button
                    onClick={() => handleAddHighlight("green")}
                    className="reader-tooltip__color-btn reader-tooltip__color-btn--green"
                    title="Tô màu xanh"
                  />
                  <button
                    onClick={() => handleAddHighlight("pink")}
                    className="reader-tooltip__color-btn reader-tooltip__color-btn--pink"
                    title="Tô màu hồng"
                  />
                  <div className="reader-tooltip__divider" />
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="reader-tooltip__text-btn"
                  >
                    📝 Thêm Note
                  </button>
                  <button
                    onClick={clearSelection}
                    className="reader-tooltip__close-btn"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddNote} className="reader-note-form">
                  <div className="reader-note-form__colors">
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Màu nhãn:
                    </span>
                    {["yellow", "green", "pink"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedHighlightColor(c)}
                        className={`reader-tooltip__color-btn reader-tooltip__color-btn--${c} ${selectedHighlightColor === c ? "reader-tooltip__color-btn--active" : ""}`}
                      />
                    ))}
                  </div>
                  <textarea
                    autoFocus
                    placeholder="Nhập ghi chú của bạn cho đoạn văn bản này..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="reader-note-form__input"
                  />
                  <div className="reader-note-form__actions">
                    <button
                      type="button"
                      onClick={() => setShowNoteForm(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      Lưu Note
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>

      {/* DIALOG VIEWING/EDITING HIGHLIGHT */}
      {viewingAnnotation && (
        <div
          className="reader-modal-overlay"
          onClick={() => setViewingAnnotation(null)}
        >
          <div
            className="reader-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reader-modal-header">
              <h3>Chi tiết Annotation</h3>
              <button
                className="reader-modal-close"
                onClick={() => setViewingAnnotation(null)}
              >
                ✕
              </button>
            </div>
            <div className="reader-modal-body">
              <p className="reader-modal__label">Đoạn văn bản trích dẫn:</p>
              <blockquote
                className={`reader-modal__quote reader-modal__quote--${viewingAnnotation.color}`}
              >
                "{viewingAnnotation.selectedText}"
              </blockquote>

              <p className="reader-modal__label" style={{ marginTop: "16px" }}>
                Ghi chú của bạn:
              </p>
              {viewingAnnotation.note ? (
                <p className="reader-modal__note-text">
                  {viewingAnnotation.note}
                </p>
              ) : (
                <p className="reader-modal__note-empty">
                  Chưa có ghi chú nào được lưu cho đoạn văn này.
                </p>
              )}
              <p className="reader-modal__meta">
                Được tạo ngày: {viewingAnnotation.createdAt} - Chương{" "}
                {viewingAnnotation.chapterIndex + 1}
              </p>
            </div>
            <div className="reader-modal-footer">
              <button
                onClick={() => handleDeleteAnnotation(viewingAnnotation.id)}
                className="btn btn-secondary reader-modal__delete-btn"
              >
                Xóa Highlight này
              </button>
              <button
                onClick={() => setViewingAnnotation(null)}
                className="btn btn-primary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
