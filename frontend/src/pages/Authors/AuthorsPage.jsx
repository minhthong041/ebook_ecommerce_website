import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AUTHORS } from "../../data/authorsData";
import "./AuthorsPage.css";

function AuthorCard({ author }) {
  return (
    <article className="authors-card">
      <div className="authors-card__avatar" aria-hidden="true">
        {author.avatar}
      </div>
      <div className="authors-card__content">
        <div className="authors-card__top">
          <h3 className="authors-card__name">{author.name}</h3>
          <span className="authors-card__genre">{author.genre}</span>
        </div>
        <p className="authors-card__bio">{author.bio}</p>
        <div className="authors-card__footer">
          <span>{author.booksCount} sách</span>
          <span>{author.rating.toFixed(1)}★</span>
        </div>
      </div>
      <Link to={`/authors/${author.id}`} className="authors-card__link">
        Xem chi tiết
      </Link>
    </article>
  );
}

export default function AuthorsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAuthors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return AUTHORS;

    return AUTHORS.filter((author) =>
      author.name.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery]);

  return (
    <main className="authors-page">
      <section className="authors-hero" aria-labelledby="authors-title">
        <div className="authors-hero__inner">
          <div>
            <span className="authors-hero__eyebrow">👩‍💼 Tác giả BookVerse</span>
            <h1 className="authors-hero__title" id="authors-title">
              Khám phá tác giả nổi bật
            </h1>
            <p className="authors-hero__description">
              Dễ dàng tìm kiếm tác giả yêu thích và khám phá đầu sách phù hợp
              với sở thích.
            </p>
          </div>
          <form
            className="authors-search"
            onSubmit={(event) => event.preventDefault()}
            role="search"
          >
            <label className="authors-search__label" htmlFor="author-search">
              Tìm tác giả
            </label>
            <div className="authors-search__field">
              <span className="authors-search__icon">🔎</span>
              <input
                id="author-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nhập tên tác giả..."
                className="authors-search__input"
                aria-label="Tìm tác giả theo tên"
              />
            </div>
          </form>
        </div>
      </section>

      <section
        className="authors-list-section"
        aria-labelledby="authors-list-title"
      >
        <div className="authors-list__header">
          <h2 id="authors-list-title">Danh sách tác giả</h2>
          <p>{filteredAuthors.length} tác giả tìm thấy</p>
        </div>

        {filteredAuthors.length > 0 ? (
          <div className="authors-grid">
            {filteredAuthors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        ) : (
          <div className="authors-empty">
            <p>Không tìm thấy tác giả phù hợp.</p>
          </div>
        )}
      </section>
    </main>
  );
}
