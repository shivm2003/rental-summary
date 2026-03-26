import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FileText, MessageSquare, Star, ArrowLeft } from 'lucide-react';
import './OrderDetails.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrder(res.data.order);

        // Check if order is completed (rental period ended)
        const prod = res.data.order.products[0];
        if (prod?.rentalPeriod?.end) {
          const endDate = new Date(prod.rentalPeriod.end);
          endDate.setHours(23, 59, 59, 999);
          setIsCompleted(new Date() > endDate);
        }

        // Check if user already reviewed this product for this order
        try {
          const revRes = await axios.get(`${API}/api/products/${res.data.order.products[0]?.product?.id}/reviews`);
          const myReview = (revRes.data.reviews || []).find(r => r.user_name && res.data.order.id);
          // Simple check: if any review exists from current user for this order
          if (myReview) setHasReviewed(true);
        } catch { }
      } catch (err) {
        console.error("Order details fetch failed", err);
        toast.error("Could not load order details");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrderDetails();
  }, [id, user]);

  const handleDownloadInvoice = () => {
    const productInfo = order.products[0]?.product;
    const invoiceHTML = `
      <!DOCTYPE html>
      <html><head><title>Invoice - ${order.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #212121; }
        .inv-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2874f0; padding-bottom: 20px; margin-bottom: 30px; }
        .inv-logo { font-size: 24px; font-weight: 700; color: #2874f0; }
        .inv-logo small { display: block; font-size: 11px; color: #878787; font-weight: 400; }
        .inv-meta { text-align: right; font-size: 13px; color: #555; }
        .inv-meta h2 { font-size: 20px; color: #212121; margin-bottom: 4px; }
        .inv-parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .inv-party { width: 48%; }
        .inv-party h4 { font-size: 11px; text-transform: uppercase; color: #878787; letter-spacing: 1px; margin-bottom: 8px; }
        .inv-party p { font-size: 13px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead { background: #f5f5f5; }
        th { padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #555; letter-spacing: 0.5px; border-bottom: 2px solid #e0e0e0; }
        td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
        .inv-totals { width: 320px; margin-left: auto; }
        .inv-totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .inv-totals .row.total { border-top: 2px solid #212121; font-weight: 700; font-size: 16px; padding-top: 12px; margin-top: 4px; }
        .inv-totals .row.free { color: #388e3c; }
        .inv-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #878787; text-align: center; }
        .inv-stamp { margin-top: 30px; text-align: right; }
        .inv-stamp p { font-size: 13px; color: #2874f0; font-weight: 600; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <div class="inv-header">
          <div class="inv-logo">Everything Rental<small>India's Rental Marketplace</small></div>
          <div class="inv-meta">
            <h2>TAX INVOICE</h2>
            <p>Invoice #: INV-${order.id}</p>
            <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p>Order ID: ${order.id}</p>
          </div>
        </div>
        <div class="inv-parties">
          <div class="inv-party">
            <h4>Billed To</h4>
            <p><strong>Customer</strong><br/>Order placed on Everything Rental Platform</p>
          </div>
          <div class="inv-party">
            <h4>Lender / Seller</h4>
            <p><strong>${order.lender?.name || 'Verified Lender'}</strong><br/>${order.lender?.email || ''}<br/>Platform Verified Partner</p>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Product</th><th>Rental Period</th><th>Duration</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>${productInfo?.name || 'Rental Product'}</td>
              <td>${order.products[0]?.rentalPeriod?.start ? new Date(order.products[0].rentalPeriod.start).toLocaleDateString('en-IN') + ' - ' + new Date(order.products[0].rentalPeriod.end).toLocaleDateString('en-IN') : 'N/A'}</td>
              <td>${order.products[0]?.rentalPeriod?.durationDays || 1} days</td>
              <td style="text-align:right">₹${order.baseRental || order.totalAmount}</td>
            </tr>
          </tbody>
        </table>
        <div class="inv-totals">
          <div class="row"><span>Base Rental</span><span>₹${order.baseRental || order.totalAmount}</span></div>
          <div class="row"><span>Security Deposit (Refundable)</span><span>₹${order.securityDeposit || 0}</span></div>
          <div class="row ${(order.deliveryCharge || 0) == 0 ? 'free' : ''}"><span>Delivery Charges</span><span>${(order.deliveryCharge || 0) > 0 ? '₹' + order.deliveryCharge : 'FREE'}</span></div>
          <div class="row total"><span>Total Amount</span><span>₹${order.totalAmount}</span></div>
        </div>
        <div class="inv-stamp">
          <p>Authorized by Everything Rental</p>
          <small style="color:#878787">This is a computer-generated invoice and does not require a physical signature.</small>
        </div>
        <div class="inv-footer">
          <p>Everything Rental | India's Premier Rental Marketplace | Contact: +91 9198496753</p>
          <p style="margin-top:4px">Thank you for renting with us! Terms & conditions apply.</p>
        </div>
      </body></html>
    `;
    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(invoiceHTML);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!querySubject || !queryMessage) return toast.error("Please fill all fields");
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/queries`, {
        orderId: order.id,
        productId: order.products[0].product.id,
        subject: querySubject,
        message: queryMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Query submitted! We will contact you soon.");
      setShowQueryModal(false);
      setQuerySubject('');
      setQueryMessage('');
    } catch (err) {
      toast.error("Failed to submit query");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please provide a rating");
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/products/${order.products[0].product.id}/reviews`, {
        orderId: order.id,
        rating,
        comment: reviewComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Review submitted successfully!");
      setShowReviewModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (loading) return <div className="fk-order-details" style={{textAlign: 'center', paddingTop: '100px'}}>Loading Order Details...</div>;
  if (!order) return <div className="fk-order-details" style={{textAlign: 'center', paddingTop: '100px'}}>Order not found.</div>;

  const productInfo = order.products[0]?.product;

  const steps = [
    { label: 'Ordered', status: ['ORDERED', 'PAID', 'CONFIRMED'] },
    { label: 'Processed', status: ['PROCESSED', 'PACKED'] },
    { label: 'Shipped', status: ['SHIPPED', 'OUT_FOR_DELIVERY'] },
    { label: 'Delivered', status: ['DELIVERED', 'COMPLETED'] },
  ];

  const currentStepIndex = steps.findIndex(s => s.status.includes(order.status));
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="fk-order-details">
      <div className="fk-order-container">
        <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#2874f0', alignSelf: 'flex-start', marginBottom: '12px' }}>
          <ArrowLeft size={16} /> Back to My Orders
        </button>

        <div className="fk-order-card">
          <div className="fk-order-header">
            <div>
              <h2 style={{ fontSize: '14px', color: '#878787', textTransform: 'uppercase', marginBottom: '4px' }}>Order ID: {order.id}</h2>
              <p style={{ fontSize: '12px', color: '#212121' }}>Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <button className="fk-btn-invoice" onClick={handleDownloadInvoice}>
              <FileText size={16} /> Download Invoice
            </button>
          </div>

          {/* Flipkart Style Status Tracker */}
          <div className="fk-status-tracker-container">
            <div className="fk-status-line">
              {steps.map((step, idx) => (
                <div key={idx} className={`fk-status-step ${idx <= activeIndex ? 'active' : ''}`}>
                  <div className="fk-status-dot"></div>
                  <div className="fk-status-label">{step.label}</div>
                  {idx < steps.length - 1 && <div className="fk-status-connector"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="fk-order-main-content">
            <div className="fk-product-row">
              <div className="fk-product-image">
                <img src={productInfo?.images?.[0]?.url || '/assets/images/placeholder.jpg'} alt={productInfo?.name} />
              </div>
              <div className="fk-product-info">
                <h3>{productInfo?.name}</h3>
                <p>Seller: {order.lender?.name || 'Verified Lender'}</p>
                {order.products[0]?.rentalPeriod?.start && (
                  <p>Rental Period: {new Date(order.products[0].rentalPeriod.start).toLocaleDateString()} to {new Date(order.products[0].rentalPeriod.end).toLocaleDateString()}</p>
                )}
                <div className="fk-product-price">₹{order.totalAmount}</div>
              </div>
            </div>

            <div className="fk-order-actions">
              <button className="fk-btn-action" onClick={() => setShowQueryModal(true)}>
                <MessageSquare size={18} /> Raise a Query
              </button>
              {isCompleted && !hasReviewed ? (
                <button className="fk-btn-action" onClick={() => setShowReviewModal(true)} style={{ borderColor: '#ff9f00', background: '#fffbeb' }}>
                  <Star size={18} style={{ color: '#ff9f00' }} /> Write a Review
                </button>
              ) : hasReviewed ? (
                <div className="fk-btn-action" style={{ borderColor: '#4ade80', background: '#f0fdf4', color: '#166534', cursor: 'default' }}>
                  ✓ Review Submitted
                </div>
              ) : (
                <div className="fk-btn-action" style={{ color: '#94a3b8', cursor: 'default', borderColor: '#e2e8f0' }}>
                  <Star size={18} /> Review available after delivery
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fk-order-card fk-address-grid">
          <div className="fk-address-card">
            <h3>Price Details</h3>
            <div className="fk-price-details-row">
              <span>Base Rental</span> <span>₹{order.baseRental}</span>
            </div>
            <div className="fk-price-details-row">
              <span>Security Deposit</span> <span>₹{order.securityDeposit}</span>
            </div>
            <div className="fk-price-details-row">
              <span>Delivery Charge</span> <span>{order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'FREE'}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '15px 0' }} />
            <div className="fk-price-details-row" style={{ fontWeight: 600, fontSize: '16px' }}>
              <span>Total Amount</span> <span>₹{order.totalAmount}</span>
            </div>
          </div>
          
          <div className="fk-address-card">
            <h3>Lender Information</h3>
            <p style={{ fontSize: '14px', marginBottom: '4px' }}><strong>{order.lender?.name || 'Verified Lender'}</strong></p>
            <p style={{ fontSize: '13px', color: '#878787', marginBottom: '12px' }}>{order.lender?.email}</p>
            <div style={{ background: '#f5faff', padding: '12px', border: '1px solid #d0e4ff', borderRadius: '2px', fontSize: '12px', color: '#2874f0' }}>
              Your order is secured and covered under Everything Rental platform guidelines.
            </div>
          </div>
        </div>

      </div>

      {/* Invoice Printable View */}
      <div className="fk-invoice-printable">
        <h1 style={{color: '#2874f0', marginBottom: '20px'}}>Everything Rental Invoice</h1>
        <hr style={{marginBottom: '20px'}}/>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px'}}>
          <div>
            <h3>Order ID: {order.id}</h3>
            <p>Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div style={{textAlign: 'right'}}>
            <h3>Lender Details</h3>
            <p>{order.lender?.name || 'Verified Lender'}</p>
          </div>
        </div>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '30px'}}>
          <thead>
            <tr style={{borderBottom: '2px solid #ddd'}}>
              <th style={{padding: '10px 0'}}>Product</th>
              <th style={{padding: '10px 0'}}>Duration (Days)</th>
              <th style={{padding: '10px 0'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '10px 0'}}>{productInfo?.name}</td>
              <td style={{padding: '10px 0'}}>{order.products[0]?.rentalPeriod?.durationDays || 1}</td>
              <td style={{padding: '10px 0'}}>₹{order.totalAmount}</td>
            </tr>
          </tbody>
        </table>
        <div style={{textAlign: 'right'}}>
          <h2>Grand Total: ₹{order.totalAmount}</h2>
        </div>
      </div>

      {/* Query Modal */}
      {showQueryModal && (
        <div className="fk-modal-overlay">
          <div className="fk-modal-content">
            <div className="fk-modal-header">
              <h3>Raise a Query</h3>
              <button className="fk-close-btn" onClick={() => setShowQueryModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitQuery}>
              <div className="fk-form-group">
                <label>Subject</label>
                <input type="text" value={querySubject} onChange={e => setQuerySubject(e.target.value)} placeholder="E.g. Item defective, delayed delivery" required />
              </div>
              <div className="fk-form-group">
                <label>Message</label>
                <textarea value={queryMessage} onChange={e => setQueryMessage(e.target.value)} placeholder="Please detail your issue here..." required></textarea>
              </div>
              <button type="submit" className="fk-btn-submit">Submit Query</button>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fk-modal-overlay">
          <div className="fk-modal-content">
            <div className="fk-modal-header">
              <h3>Write a Review</h3>
              <button className="fk-close-btn" onClick={() => setShowReviewModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="fk-form-group">
                <label>Rating</label>
                <div className="fk-star-rating">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Star
                      key={num}
                      size={32}
                      className={num <= rating ? "fk-star active" : "fk-star"}
                      onClick={() => setRating(num)}
                    />
                  ))}
                </div>
              </div>
              <div className="fk-form-group">
                <label>Review Comment (Optional)</label>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Describe your experience with this product..."></textarea>
              </div>
              <button type="submit" className="fk-btn-submit" disabled={rating === 0}>Submit Review</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
