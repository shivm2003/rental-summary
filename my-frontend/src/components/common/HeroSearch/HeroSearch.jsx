import React, { useState } from 'react';
const TAG_LINE = "Find everything you need in one place";

export default function HeroSearch({ initial = '', onSearch }) {
  const [val, setVal] = useState(initial);
  
  return (
    <div>
      <h1>Everything Rental</h1>
      <p>{TAG_LINE}</p>
    </div>
  );
}