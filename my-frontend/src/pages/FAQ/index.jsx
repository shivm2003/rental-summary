import React from 'react';
export default function FAQ() {
  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
      <h1>Frequently Asked Questions</h1>
      <div style={{ marginTop: '20px' }}>
        <h3>How do I rent an item?</h3>
        <p>You can search for the item you want, add it to your cart, and proceed to checkout.</p>
        <h3 style={{ marginTop: '15px' }}>How do I become a lender?</h3>
        <p>Click on 'Become a Lender' in the top right corner and fill out the details.</p>
        <h3 style={{ marginTop: '15px' }}>Is there a security deposit?</h3>
        <p>Some premium items may require a refundable security deposit.</p>
      </div>
    </div>
  );
}
