import React from 'react';
export default function Terms() {
  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
      <h1>Terms & Conditions</h1>
      <div style={{ marginTop: '20px' }}>
        <h3>1. Agreement to Terms</h3>
        <p>By using EveryThing Rental, you agree to abide by these terms for renting products.</p>
        <h3 style={{ marginTop: '15px' }}>2. Rental Duration and Late Fees</h3>
        <p>Items must be returned by the end date. Late returns may incur daily penalty charges.</p>
        <h3 style={{ marginTop: '15px' }}>3. Damage Policy</h3>
        <p>Users are responsible for any damages. The security deposit may be partially or fully withheld if the item is returned damaged.</p>
      </div>
    </div>
  );
}
