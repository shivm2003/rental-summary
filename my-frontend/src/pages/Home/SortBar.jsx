const sorts = [
    { key: 'popularity',  label: 'Popularity' },
    { key: 'price',       label: 'Price -- Low to High' },
    { key: 'price-desc',  label: 'Price -- High to Low' },
    { key: 'newest',      label: 'Newest First' },
  ];
  
  export default function SortBar({ sort = 'popularity', onSort, total }) {
    return (
      <div className="sort-bar">
        <p className="results">Showing 1-8 of {total} results</p>
        <select value={sort} onChange={e => onSort(e.target.value)} className="form-select">
          {sorts.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
    );
  }