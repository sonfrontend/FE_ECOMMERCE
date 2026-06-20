import React from 'react';
import { Typography } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/utils/imageUrl';
import { handleQuickBuy } from '@/utils/quickBuy';

const { Text } = Typography;

export interface ProductCardProps {
  productId: string;
  name: string;
  imageUrl: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  soldQuantity?: number;
  rating?: number;
  reviewsCount?: number;
  likesCount?: number;
  isFavorite?: boolean;
  onFavoriteClick?: (e: React.MouseEvent, productId: string) => void;
  showFavoriteIcon?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  name,
  imageUrl,
  currentPrice,
  originalPrice,
  discountPercentage,
  soldQuantity = 0,
  rating = 5.0,
  reviewsCount,
  likesCount,
  isFavorite = false,
  onFavoriteClick,
  showFavoriteIcon = false
}) => {
  const navigate = useNavigate();
  const _originalPrice = originalPrice ?? currentPrice;
  const _discountPercentage = discountPercentage ?? (_originalPrice > 0 ? Math.round((1 - currentPrice / _originalPrice) * 100) : 0);
  const _reviewsCount = reviewsCount ?? 0;
  const _likesCount = likesCount ?? 0;

  return (
    <Link
      to={`/product/${productId}`}
      className='group flex flex-col cursor-pointer border border-transparent hover:border-gray-300 hover:-translate-y-1 hover:shadow-md transition-all duration-300 bg-white relative rounded-lg overflow-hidden h-full'
    >
      <div className='relative w-full aspect-[4/5] bg-[#f5f5f5] overflow-hidden'>
        <img
          alt={name}
          src={imageUrl?.startsWith('http') ? imageUrl : getImageUrl(imageUrl)}
          className='absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
        />
        {/* Nút Yêu thích (Trái tim) */}
        {showFavoriteIcon && (
          <div 
            className='absolute top-3 right-3 bg-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 hover:bg-gray-50 transition-all z-10'
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onFavoriteClick && onFavoriteClick(e, productId); 
            }}
          >
            {isFavorite ? (
              <HeartFilled className='text-blue-500 text-lg' />
            ) : (
              <HeartOutlined className='text-blue-500 text-lg hover:text-blue-600' />
            )}
          </div>
        )}
      </div>

      <div className='p-3 flex flex-col flex-1'>
        <Text
          className='text-[14px] md:text-[15px] text-gray-800 line-clamp-2 leading-snug group-hover:text-[#ee4d2d] transition-colors mb-2'
          title={name}
        >
          {name}
        </Text>
        
        {/* Đánh giá, sao, lượt thích */}
        <div className='flex items-center text-[11px] md:text-xs text-gray-500 mb-3'>
          <div className='flex items-center text-[#ffce3d] mr-1'>
            <span className='text-sm leading-none'>★</span>
            <span className='text-gray-600 ml-1 font-medium'>{rating}</span>
          </div>
          <span className='mr-1.5'>({_reviewsCount})</span>
          <span className='mx-1.5 text-gray-300'>|</span>
          <div className='flex items-center text-gray-500'>
            <HeartFilled className='text-gray-400 text-xs mr-1' />
            <span>{_likesCount}</span>
          </div>
        </div>
        
        <div className='flex flex-col mt-auto'>
          <div className='flex items-center justify-between w-full mb-1.5'>
            {_originalPrice > currentPrice ? (
              <div className='flex items-center gap-1.5'>
                <span className='text-gray-400 text-[11px] md:text-xs line-through'>
                  {new Intl.NumberFormat('vi-VN').format(_originalPrice)} đ
                </span>
                <div className='flex items-center bg-[#ffebb3] text-[#ee4d2d] text-[10px] md:text-[11px] font-bold px-1.5 rounded-sm h-[18px]'>
                  <span className='mr-0.5'>⚡</span>
                  <span>-{_discountPercentage}%</span>
                </div>
              </div>
            ) : <div />}
            <span className='text-gray-500 text-[10px] md:text-[11px] ml-1 whitespace-nowrap'>
              Sold {soldQuantity}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-[#ee4d2d] font-bold text-[16px] md:text-[18px] leading-none'>
              {currentPrice > 0 ? `${new Intl.NumberFormat('vi-VN').format(currentPrice)} đ` : 'Liên hệ'}
            </span>
            <div 
              className='bg-[#ee4d2d] text-white text-[11px] md:text-[13px] font-medium px-3 py-1.5 rounded shadow-sm whitespace-nowrap hover:bg-[#d73f22] transition-colors cursor-pointer'
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickBuy(productId, navigate);
              }}
            >
              BUY NOW
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
