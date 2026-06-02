import "./CategoryFilter.css";

export default function CategoryFilter({
  categories,
  selectedCats,
  onToggleCategory,
  onClearCategories,
}) {
  return (
    <div className="category-filter">
      <div className="category-filter__header">
        <span className="category-filter__title">Thể loại</span>
        <button
          type="button"
          className="category-filter__clear"
          onClick={onClearCategories}
        >
          Xóa
        </button>
      </div>

      <div className="category-filter__list">
        {categories.map((category) => (
          <label
            key={category.value}
            className={`category-filter__item${selectedCats.includes(category.value) ? " category-filter__item--active" : ""}`}
          >
            <input
              type="checkbox"
              checked={selectedCats.includes(category.value)}
              onChange={() => onToggleCategory(category.value)}
            />
            <span className="category-filter__label">{category.label}</span>
            <span className="category-filter__count">{category.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
