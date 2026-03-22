export default function Pagination({ page = 1, limit = 8, total, onPage }) {
    const pages = Math.ceil(total / limit);
    if (pages <= 1) return null;
  
    return (
      <div className="pagination">
        <button disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="pages">{page} / {pages}</span>
        <button disabled={page === pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    );
  }