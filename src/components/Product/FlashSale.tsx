import React, { useEffect, useState } from 'react';
import { Typography, Card, Spin } from 'antd';
import http from '@/apis/http';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const FlashSale: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFlashSale = async () => {
      setLoading(true);
      try {
        const res = await http.get('/api/Product/flash-sale');
        if (res.data) {
          // Lấy items nếu có phân trang, nếu không thì lấy res.data
          setProducts(res.data.items || res.data);
        }
      } catch (error) {
        console.error('Lỗi lấy danh sách Flash Sale', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  if (loading) {
    return <div className="py-10 text-center"><Spin /></div>;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="bg-white mt-5 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl md:text-3xl">⚡</span>
          <Title level={3} className="!text-[#ee4d2d] !m-0 font-bold italic tracking-wider">
            FLASH SALE
          </Title>
        </div>
        <div className="text-gray-500 cursor-pointer hover:text-[#ee4d2d] transition-colors text-sm font-medium" onClick={() => navigate('/search?sale=true')}>
          Xem tất cả &gt;
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>

        {products?.length === 0 && (
          <div className="py-10 text-center text-gray-500">Không có sản phẩm nào trong Flash Sale</div>
        ) }

        <div className="flex space-x-4">
          {products?.map((product) => (
            <div 
              key={product.id || product.productId}
              className="flex-none w-36 md:w-48 cursor-pointer group relative bg-white border border-transparent hover:border-[#ee4d2d] transition-all rounded-md overflow-hidden"
              onClick={() => navigate(`/product/${product.productId}`)}
            >
              <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                <img 
                  src={product.imageUrl?.startsWith('http') ? product.imageUrl : `http://localhost:5000${product.imageUrl}`}
                  alt={product.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
               
              </div>

              <div className="p-2 flex flex-col justify-between h-24">
                <Text className="text-xs md:text-sm text-gray-700 line-clamp-2 leading-tight group-hover:text-[#ee4d2d] transition-colors">
                  {product.productName}
                </Text>
                
                <div className='flex flex-col mt-auto pt-2'>
                  <div className='h-[18px] flex items-center justify-between w-full'>
                    {product.originalPrice > product.currentPrice ? (
                      <div className='flex items-center gap-1.5'>
                        <span className='text-gray-400 text-[10px] md:text-[11px] line-through'>
                          {formatPrice(product.originalPrice)}
                        </span>
                        <div className='flex items-center bg-[#ffebb3] text-[#ee4d2d] text-[9px] md:text-[10px] font-bold px-1 rounded-sm'>
                          <span className='mr-0.5'>⚡</span>
                          <span>-{product.discountPercentage || Math.round((1 - product.currentPrice/product.originalPrice)*100)}%</span>
                        </div>
                      </div>
                    ) : <div></div>}
                    <span className='text-gray-500 text-[9px] md:text-[10px] ml-1 whitespace-nowrap'>Đã bán {product.soldQuantity || product.SoldQuantity || 0}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-[#ee4d2d] font-bold text-sm md:text-[15px] leading-none'>
                      {formatPrice(product.currentPrice)}
                    </span>
                    <div className='bg-[#ee4d2d] text-white text-[9px] md:text-[10px] px-1.5 py-0.5 md:px-2 rounded shadow-sm whitespace-nowrap hover:bg-[#d73f22] transition-colors'>
                      Mua Ngay
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSale;
