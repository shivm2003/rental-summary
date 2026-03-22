import { useEffect, useState } from 'react';
import { fetchProducts } from '../services/products';

export default function useProducts(filters) {
  const [data, setData] = useState({ products: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchProducts(filters)
      .then(response => {
        // ✅ Handle S3 backend response structure
        // Backend returns { listings: [...], total, page, pages }
        // Frontend expects { products: [...], total: 0 }
        
        const listings = response.listings || response.products || [];
        const total = response.total || 0;
        
        // Transform listings to ensure photos array exists for S3
        const products = listings.map(listing => ({
          ...listing,
          // Ensure photos array exists (backend sends photos with fullUrl for S3)
          photos: listing.photos || [],
          // Map backend fields to frontend friendly names
          id: listing.id || listing._id,
          name: listing.item_name || listing.name,
          price: listing.rental_price_per_day || listing.price || 0,
          cat: listing.category || listing.cat,
        }));
        
        setData({ products, total });
      })
      .catch(err => {
        console.error('useProducts Error:', err);
        setError(err.message || 'Failed to load products');
      })
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { ...data, loading, error };
}