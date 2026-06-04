import React, { useEffect, useState } from 'react';
import { Carousel, Typography, Button } from 'antd';
import http from '@/apis/http';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const HeroBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const navigate = useNavigate();

  // Các banner mô tả shop (mặc định)
  const defaultBanners = [
    {
      id: 'shop-1',
      title: 'BỘ SƯU TẬP MỚI',
      description: 'Phong cách tối giản, nâng tầm diện mạo của bạn.',
      imageUrl: 'http://localhost:5000/images/banners/normal.png',
    },
  ];

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await http.get('/api/Promotion/active');
        if (res.data && res.data.length > 0) {
          // Map promotion imageUrl to full backend URL if it doesn't start with http
          const fetchedPromotions = res.data.map((p: any) => ({
             ...p,
             id: p.id,
             title: p.title,
             description: p.description,
             imageUrl: `http://localhost:5000/images/banners/${p.imageUrl}`,
             discountPercentage: p.discountPercentage
          }));
          setPromotions(fetchedPromotions);
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu khuyến mãi', error);
      }
    };
    fetchPromotions();
  }, []);

  // Kết hợp Khuyến mãi (từ API) lên đầu, theo sau là Banner mô tả shop
  const allBanners = [...promotions, ...defaultBanners];

  console.log(allBanners);
  

  return (
    <div className='w-full'>
      <style>{`
        .ant-carousel .slick-dots li button {
          background: #e5e7eb !important;
          opacity: 0.6;
          height: 10px;
          width: 10px;
          border-radius: 50%;
        }
        .ant-carousel .slick-dots li.slick-active button {
          background: #ee4d2d !important;
          opacity: 1;
          width: 14px;
          height: 14px;
        }
        @keyframes subtleZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .banner-bg-zoom {
          animation: subtleZoom 15s ease-in-out infinite alternate;
        }
      `}</style>

      <Carousel autoplay effect='fade' dotPosition='bottom' className='w-full'>
        {allBanners.map((banner, index) => (
          <div 
            key={banner.id || index} 
            className='relative w-full outline-none overflow-hidden group cursor-pointer'
            onClick={() => banner.link && navigate(banner.link)}
          >
            {/* Ảnh Banner kích thước to hơn (cao hơn) */}
            <div
              className='w-full h-[450px] md:h-[600px] lg:h-[90vh] bg-cover bg-center banner-bg-zoom origin-center'
              style={{ backgroundImage: `url(${banner.imageUrl})` }}
            />

            {/* Lớp phủ (Overlay) tối hơn để làm nổi bật chữ */}
            <div className='absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500' />

            {/* Khu vực chứa Chữ (Title & Description) - Đặt lùi lên phía trên (top) một chút */}
            {banner.title && (
              <div className='absolute inset-0 flex flex-col justify-start items-center text-center pt-28 md:pt-40 px-4'>
                <Title level={1} className='!text-white !text-5xl md:!text-7xl lg:!text-8xl font-black tracking-tight mb-6 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]'>
                  {banner.title}
                </Title>
                
                {banner.description && (
                  <Text className='!text-white text-lg md:text-2xl lg:text-3xl max-w-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-8 font-semibold'>
                    {banner.description}
                  </Text>
                )}

                {banner.discountPercentage > 0 ? (
                  <div className="bg-[#ee4d2d] text-white px-6 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-lg font-bold uppercase tracking-wider shadow-lg">
                    Giảm {banner.discountPercentage}% Toàn Đơn
                  </div>
                ): <div className="bg-[#ee4d2d] text-white px-6 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-lg font-bold uppercase tracking-wider shadow-lg">
                    MUA NGAY
                  </div>}
              </div>
            )}
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default HeroBanner;
