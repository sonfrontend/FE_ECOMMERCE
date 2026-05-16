import React from 'react';
import { Button, Typography, Carousel } from 'antd';

const { Title, Text } = Typography;

const banners = [
  {
    id: 1,
    tag: 'Bộ Sưu Tập Mới',
    title: 'THU ĐÔNG 2026',
    desc: 'Sự kết hợp hoàn hảo giữa chất liệu len cao cấp và phong cách tối giản Bắc Âu.',
    bg: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80'
  },
  {
    id: 2,
    tag: 'Ưu Đãi Đặc Quyền',
    title: 'BLACK FRIDAY',
    desc: 'Cơ hội mua sắm lớn nhất năm. Giảm giá lên đến 70% cho tất cả các mặt hàng.',
    bg: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80'
  },
  {
    id: 3,
    tag: 'Phong Cách Sống',
    title: 'H&M HOME',
    desc: 'Làm mới không gian sống của bạn với bộ sưu tập nội thất mùa thu ấm áp.',
    bg: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80'
  }
];

const HeroBanner: React.FC = () => {
  return (
    <div className='w-full'>
      <style>{`
        /* Hiệu ứng Zoom nhẹ (Ken Burns effect) cho ảnh nền để tăng cảm giác cao cấp */
        @keyframes subtleZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .banner-bg-zoom {
          animation: subtleZoom 10s ease-in-out infinite alternate;
        }
        
        /* Chỉnh lại style của dấu chấm Carousel (Dots) sang màu đen để hợp với nền sáng */
        .ant-carousel .slick-dots li button {
          background: #000 !important;
          opacity: 0.3;
          height: 4px;
        }
        .ant-carousel .slick-dots li.slick-active button {
          opacity: 1;
          width: 24px;
        }
      `}</style>

      <Carousel autoplay effect='fade' dotPosition='bottom' className='w-full h-[350px] md:h-[500px]'>
        {banners.map((banner) => (
          <div key={banner.id} className='relative w-full h-[350px] md:h-[500px] outline-none overflow-hidden group'>
            {/* Background Image (Sáng, không có overlay đen) */}
            <div
              className='absolute inset-0 w-full h-full banner-bg-zoom origin-center'
              style={{
                backgroundImage: `url(${banner.bg})`,
                backgroundSize: '100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center 30%'
              }}
            />

            {/* Light Gradient Overlay: Giúp chữ đen nổi bật trên mọi nền ảnh mà không làm tối ảnh */}
            <div className='absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-transparent' />

            {/* Content Area */}
            <div className='relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-6 md:px-12'>
              <Text className='text-gray-800 text-sm md:text-base tracking-[0.25em] uppercase font-semibold mb-2'>
                {banner.tag}
              </Text>

              <Title level={1} className='!text-black !text-4xl md:!text-6xl font-bold tracking-tight mb-3 uppercase'>
                {banner.title}
              </Title>

              <Text className='text-gray-700 text-base md:text-lg max-w-2xl mb-10 font-medium leading-relaxed'>
                {banner.desc}
              </Text>

              <Button
                size='large'
                className='bg-black text-white border-none hover:!bg-gray-800 hover:!text-white h-14 px-10 md:px-14 rounded-none font-semibold text-base uppercase tracking-widest transition-transform duration-300 hover:scale-105 shadow-lg'
              >
                Mua sắm ngay
              </Button>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default HeroBanner;
