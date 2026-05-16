import React from 'react';
import { Button, Typography, Row, Col, Carousel, Tag, Badge, Rate } from 'antd';
import { ShoppingCartOutlined, HeartOutlined, FireOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  imageUrl: string;
  rating: number;
  isNew?: boolean;
}

const mockProducts: Product[] = [
  {
    id: '0706016001',
    name: 'Jade HW Skinny Denim TRS',
    type: 'Trousers',
    price: 39.99,
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
    rating: 4.5,
    isNew: true
  },
  {
    id: '0706016002',
    name: 'Ribbed Knit Top',
    type: 'Top',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
    rating: 4.0
  },
  {
    id: '0706016003',
    name: 'Oversized Biker Jacket',
    type: 'Jacket',
    price: 59.99,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
    rating: 5.0,
    isNew: true
  },
  {
    id: '0706016004',
    name: 'Patterned Maxi Dress',
    type: 'Dress',
    price: 49.99,
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
    rating: 4.8
  },
  {
    id: '0706016005',
    name: 'Chunky Platform Sneakers',
    type: 'Shoes',
    price: 69.99,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    rating: 4.2
  },
  {
    id: '0706016006',
    name: 'Wool Blend Sweater',
    type: 'Sweater',
    price: 34.99,
    imageUrl: 'https://images.unsplash.com/photo-1614252339460-e1b1062fbd65?w=600&q=80',
    rating: 4.6
  },
  {
    id: '0706016007',
    name: 'Pleated Midi Skirt',
    type: 'Skirt',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80',
    rating: 4.3,
    isNew: true
  },
  {
    id: '0706016008',
    name: 'Essential Cotton T-Shirt',
    type: 'T-Shirt',
    price: 9.99,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    rating: 4.9
  }
];

const bannerImages = [
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80'
];

const Home: React.FC = () => {
  return (
    <div className='w-full bg-gray-50 min-h-screen pb-12'>
      {/* Hero Carousel Banner */}
      <div className='relative mb-12 shadow-2xl rounded-b-[40px] overflow-hidden'>
        <Carousel autoplay effect='fade' dotPosition='bottom'>
          {bannerImages.map((img, idx) => (
            <div key={idx} className='relative h-[400px] sm:h-[500px] md:h-[600px] w-full'>
              <img src={img} alt={`Banner ${idx + 1}`} className='w-full h-full object-cover' />
              <div className='absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center px-10 md:px-24'>
                <Badge count={<FireOutlined style={{ color: '#f5222d', fontSize: '24px' }} />} offset={[10, 0]}>
                  <Title className='!text-white !mb-2 !text-4xl md:!text-6xl font-bold tracking-tight'>
                    H&M Autumn Collection
                  </Title>
                </Badge>
                <Paragraph className='!text-gray-200 !text-lg md:!text-xl max-w-lg mt-4 mb-8'>
                  Discover the personalized fashion recommendations tailored just for you. Explore the latest trends and
                  essential wardrobe staples.
                </Paragraph>
                <Button
                  type='primary'
                  size='large'
                  shape='round'
                  className='w-max bg-white !text-black hover:!bg-gray-200 border-none font-semibold px-8 h-12 flex items-center gap-2'
                >
                  Shop Now <ArrowRightOutlined />
                </Button>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <div className='max-w-[1400px] mx-auto px-6'>
        {/* Section Header */}
        <div className='flex justify-between items-end mb-8'>
          <div>
            <Title level={2} className='!mb-1 font-bold'>
              Personalized Recommendations
            </Title>
            <Text className='text-gray-500 text-base'>Based on H&M fashion dataset insights</Text>
          </div>
          <Button
            type='link'
            className='text-blue-600 font-medium hover:text-blue-800 hidden sm:flex items-center gap-1'
          >
            View All <ArrowRightOutlined />
          </Button>
        </div>

        {/* Product Grid */}
        <Row gutter={[24, 32]}>
          {mockProducts.map((product) => (
            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
              <div className='group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 h-full flex flex-col'>
                {/* Image Container */}
                <div className='relative h-[300px] w-full overflow-hidden bg-gray-100'>
                  {product.isNew && (
                    <div className='absolute top-4 left-4 z-10'>
                      <Tag color='#1677ff' className='m-0 px-3 py-1 rounded-full font-semibold shadow-md'>
                        NEW
                      </Tag>
                    </div>
                  )}
                  <div className='absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <Button
                      shape='circle'
                      icon={<HeartOutlined />}
                      className='shadow-md text-gray-500 hover:text-red-500 hover:border-red-500 bg-white/90 backdrop-blur'
                    />
                  </div>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out'
                  />
                  {/* Overlay Add to Cart */}
                  <div className='absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent'>
                    <Button
                      type='primary'
                      block
                      shape='round'
                      icon={<ShoppingCartOutlined />}
                      className='bg-white/90 !text-black border-none hover:bg-white font-semibold shadow-lg backdrop-blur'
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className='p-5 flex flex-col flex-grow'>
                  <div className='flex justify-between items-start mb-2'>
                    <Text className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>{product.type}</Text>
                    <Rate disabled defaultValue={product.rating} className='text-xs text-yellow-500' />
                  </div>
                  <Title
                    level={5}
                    className='!mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors'
                    title={product.name}
                  >
                    {product.name}
                  </Title>
                  <div className='mt-auto pt-4 flex justify-between items-center'>
                    <span className='text-xl font-bold text-gray-900'>${product.price.toFixed(2)}</span>
                    <span className='text-xs text-gray-400'>ID: {product.id.slice(-4)}</span>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Home;
