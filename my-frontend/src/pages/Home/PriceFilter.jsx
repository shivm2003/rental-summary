import React, { useState } from 'react';
export default function PriceFilter({ min = '', max = '', onChange }) {
    const [minV, setMinV] = useState(min);
    const [maxV, setMaxV] = useState(max);
    return (
      <div className="price-filter">
        <h3 className="filter-title">Price</h3>
        <div className="inputs">
          <input type="number" placeholder="Min" value={minV} onChange={e => setMinV(e.target.value)} />
          <span>to</span>
          <input type="number" placeholder="Max" value={maxV} onChange={e => setMaxV(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => onChange(minV, maxV)}>Apply</button>
      </div>
    );
  }