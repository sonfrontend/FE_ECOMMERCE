import React from 'react';
import HeroBanner from '@/components/Banner/HeroBanner';
import ProductGrid from '@/components/Product/ProductGrid';

const Home: React.FC = () => {
  return (
    <>
      <HeroBanner />
      <ProductGrid />
    </>
  );
};

export default Home;
