import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Spin, message, Empty, Row, Col } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, HeartFilled } from '@ant-design/icons';
import http from '@/apis/http';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/Product/ProductCard';

const { Title, Text } = Typography;

export default function FavoriteManage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Favorite/my-favorites-details');
      setFavorites(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleUnfavorite = async (productId: string) => {
    try {
      await http.post(`/api/Favorite/toggle/${productId}`);
      message.success('Đã bỏ yêu thích');
      fetchFavorites();
    } catch (error) {
      message.error('Lỗi khi bỏ yêu thích');
    }
  };

  return (
    <div className='p-6 bg-white rounded-lg shadow-sm min-h-[500px]'>
      <Title level={4} className='mb-6'>Sản phẩm yêu thích</Title>
      
      <Spin spinning={loading}>
        {favorites.length === 0 ? (
          <Empty description="Bạn chưa có sản phẩm yêu thích nào" className='py-10' />
        ) : (
          <Row gutter={[16, 16]}>
            {
            favorites.map((product) => (
                <Col xs={12} sm={8} md={8} lg={6} key={product.productId}>
                  <ProductCard
                    productId={product.productId}
                    name={product.productName || product.name}
                    imageUrl={product.imageUrl}
                    currentPrice={product.currentPrice || product.price || 0}
                    originalPrice={product.originalPrice}
                    discountPercentage={product.discountPercentage}
                    soldQuantity={product.soldQuantity}
                    rating={product.rating}
                    reviewsCount={product.reviewsCount}
                    likesCount={product.likesCount}
                    isFavorite={true}
                    showFavoriteIcon={true}
                    onFavoriteClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnfavorite(product.productId);
                    }}
                  />
                </Col>
              ))
            })
          </Row>
        )}
      </Spin>
    </div>
  );
}
