// components/ProductSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../../components/common/ImageWithFallback/ImageWithFallback';
import { getMainImage } from '../../services/images'; // ✅ Import S3 helper
import PropTypes from 'prop-types';

export default function ProductSection({ title, products, loading = false }) {
  console.log(`Rendering ProductSection: ${title}`, products);

  if (loading) {
    return (
      <section className="product-section container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 dark:bg-gray-700 h-48 rounded-t-xl"></div>
              <div className="p-4 space-y-2">
                <div className="bg-gray-300 dark:bg-gray-700 h-4 w-3/4 rounded"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-4 w-1/2 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="product-section container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No products available in this category
          </p>
          <Link 
            to="/" 
            className="mt-4 inline-block text-primary hover:text-primary-dark font-medium"
          >
            Browse all categories →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="product-section container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => {
          const productId = product.id || product._id || crypto.randomUUID();
          
          // ✅ Get S3 image URL from photos array (backend sends `photos`, not `image_url`)
          const imageUrl = getMainImage(product.photos);
          
          // ✅ Handle both old price field and new rental_price_per_day
          const price = product.price || product.rental_price_per_day || 0;
          
          return (
            <Link 
              to={`/product/${productId}`} 
              key={productId} 
              className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <ImageWithFallback
                src={imageUrl}  // ✅ Now uses S3 URL from getMainImage
                fallback={`/assets/images/placeholder.jpg`}  // Updated fallback path
                alt={product.item_name || product.name || 'Product'}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 line-clamp-2">
                  {product.item_name || product.name || 'Unnamed Product'}
                </h3>
                <p className="text-primary font-semibold">
                  ₹{price}/day
                </p>
                {product.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    📍 {product.location}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

ProductSection.propTypes = {
  title: PropTypes.string.isRequired,
  products: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // ✅ Updated for S3 backend structure
    photos: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fullUrl: PropTypes.string,        // S3 URL
      base64Preview: PropTypes.string,  // Base64 fallback
      photo_path: PropTypes.string      // Legacy local path
    })),
    // Legacy support (remove after full migration)
    image_url: PropTypes.string,
    name: PropTypes.string,
    item_name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rental_price_per_day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    location: PropTypes.string,
  })),
  loading: PropTypes.bool,
};