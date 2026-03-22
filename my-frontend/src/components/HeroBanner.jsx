import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchActiveBanners } from '../services/hero';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    // Auto-rotate
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  const loadBanners = async () => {
    try {
      const res = await fetchActiveBanners();
      setBanners(res.data.banners);
    } catch (err) {
      console.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const goTo = (index) => {
    setCurrentIndex(index);
  };

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  if (loading || banners.length === 0) {
    return (
      <div className="w-full h-[400px] md:h-[600px] bg-gray-200 animate-pulse rounded-xl" />
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden rounded-xl">
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Background Image */}
          <picture>
            <source media="(max-width: 768px)" srcSet={banner.mobile_image_url || banner.image_url} />
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
          </picture>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-8">
              <div className="max-w-xl text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
                  {banner.title}
                </h1>
                <p className="text-lg md:text-xl mb-2 text-white/90">
                  {banner.subtitle}
                </p>
                {banner.description && (
                  <p className="text-sm md:text-base mb-6 text-white/70">
                    {banner.description}
                  </p>
                )}
                <Link
                  to={banner.button_link || '/products'}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {banner.button_text}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-white"
          >
            <ChevronRight size={24} />
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}