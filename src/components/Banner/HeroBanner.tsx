import React, { useEffect, useState } from 'react';
import { Carousel, Typography, Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/utils/imageUrl';

const { Title, Text } = Typography;

const CustomPrevArrow = (props: any) => {
  const { onClick } = props;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 left-5 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <LeftOutlined style={{ color: '#fff', fontSize: '14px' }} />
    </div>
  );
};

const CustomNextArrow = (props: any) => {
  const { onClick } = props;
  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 right-5 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <RightOutlined style={{ color: '#fff', fontSize: '14px' }} />
    </div>
  );
};

const HeroBanner: React.FC = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const navigate = useNavigate();
  console.log("BAnner");
  

  // Các banner mô tả shop (mặc định)
  const defaultBanners = [
    // {
    //   id: 'default',
    //   title: 'NEW COLLECTION',
    //   description: 'Minimalist style, elevating your appearance.',
    //   imageUrl: getImageUrl('normal.png'),
    // },
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
             imageUrl:getImageUrl(p.imageUrl) ?? '',
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
        .ant-carousel .slick-prev,
        .ant-carousel .slick-next {
          width: 32px !important;
          height: 32px !important;
          background: rgba(0, 0, 0, 0.4) !important;
          border-radius: 50%;
          z-index: 10;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .ant-carousel .slick-prev:hover,
        .ant-carousel .slick-next:hover {
          background: rgba(0, 0, 0, 0.7) !important;
        }
        .ant-carousel .slick-prev {
          left: 20px !important;
        }
        .ant-carousel .slick-next {
          right: 20px !important;
        }
        .ant-carousel .slick-prev::before,
        .ant-carousel .slick-next::before {
          display: none !important;
        }
        @keyframes subtleZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .banner-bg-zoom {
          animation: subtleZoom 15s ease-in-out infinite alternate;
        }
      `}</style>

      <Carousel autoplay effect='fade' dots={false} arrows={true} prevArrow={<CustomPrevArrow />} nextArrow={<CustomNextArrow />} className='w-full banner-carousel'>
        {allBanners.map((banner, index) => (
          <div 
            key={banner.id || index} 
            className='relative w-full outline-none overflow-hidden group cursor-pointer'
            onClick={() => banner.link && navigate(banner.link)}
          >
            <div
              className='w-full aspect-[16/5] bg-cover bg-no-repeat bg-center center banner origin-center abc'
              style={{ backgroundImage: `url(${banner.imageUrl})` }}
            />

            {/* Lớp phủ (Overlay) tối hơn để làm nổi bật chữ */}
            {/* <div className='absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500' /> */}

            {/* Khu vực chứa Chữ (Title & Description) - Đặt lùi lên phía trên (top) một chút */}
            {/* {banner.id ==='default' &&  banner.title && (
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
                    Save {banner.discountPercentage}% On All Orders
                  </div>
                ): <div className="bg-[#ee4d2d] text-white px-6 py-2 md:px-8 md:py-3 rounded-full text-sm md:text-lg font-bold uppercase tracking-wider shadow-lg">
                    BUY NOW
                  </div>}
              </div>
            )} */}
            
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default HeroBanner;
