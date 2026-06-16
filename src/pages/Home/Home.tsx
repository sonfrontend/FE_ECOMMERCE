import React from 'react';
import HeroBanner from '@/components/Banner/HeroBanner';
import CategoryCarousel from '@/components/Category/CategoryCarousel';
import FlashSale from '@/components/Product/FlashSale';
import ProductRecommendation from '@/components/Product/ProductRecommendation';
import PromoPopup from '@/components/Home/PromoPopup';

const Home: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <PromoPopup />
      {/* Slider / Khuyến mãi */}
      <HeroBanner />
      
      {/* Khu vực Danh mục */}
      <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
        <CategoryCarousel />
      </div>

      {/* Khu vực Flash Sale */}
      <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
        <FlashSale />
      </div>

      {/* Khu vực Gợi ý Sản phẩm (AI) */}
      <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8 pb-8">
        <ProductRecommendation />
      </div>
      
    </div>
  );
};

export default Home;
