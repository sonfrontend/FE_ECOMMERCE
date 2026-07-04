import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, Button, Skeleton, message, Image, Rate, Avatar, Modal, Typography, Dropdown, Menu } from 'antd';
import { HeartOutlined, HeartFilled, MessageOutlined, ShoppingCartOutlined, ShareAltOutlined, RobotOutlined, UserOutlined, RightOutlined, LeftOutlined, StarFilled, ClockCircleOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { addAIHistory } from '@/utils/aiHistory';
import { getImageUrl } from '@/utils/imageUrl';
import { isFavorite, toggleFavorite } from '@/utils/favorite';
import { notificationService } from '@/services/notification.service';

interface ProductVariant {
  productId: string;
  variantId?: number;
  size: string;
  color: string;
  stockQuantity: number;
  price: number;
  originalPrice?: number;
  imageUrl: string;
}

interface ProductDetailData {
  productId: string;
  productCode: string;
  categoryId: number;
  categoryName: string;
  parentCategoryName?: string;
  productName: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  imageUrl: string;
  description: string;
  size: string;
  color: string;
  stockQuantity: number;
  origin?: string;
  fabricType?: string;
  rating?: number;
  reviewCount?: string | number;
  soldQuantity?: number;
  favoriteCount?: number;
  products: ProductVariant[];
}

const ProductDetail: React.FC = () => {
  const { Title, Text, Paragraph } = Typography;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [fbtProducts, setFbtProducts] = useState<any[]>([]);
  const [fbtLoading, setFbtLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [isFav, setIsFav] = useState<boolean>(false);
  const [startIndex, setStartIndex] = useState(0);
  const [isSizeGuideVisible, setIsSizeGuideVisible] = useState(false);

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);

  useEffect(() => {
    if (product?.discountPercentage && product.discountPercentage >= 15 && product.discountEndDate) {
      const endDate = new Date(product.discountEndDate).getTime();
      const startDate = product.discountStartDate ? new Date(product.discountStartDate).getTime() : 0;
      
      const updateTimer = () => {
        const now = new Date().getTime();
        
        // Nếu chưa tới thời gian bắt đầu sale, hoặc đã hết hạn
        if (now < startDate || now > endDate) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          setIsFlashSaleActive(false);
          return false; // return false to indicate timer should stop
        }

        setIsFlashSaleActive(true);
        const distance = endDate - now;

        if (distance < 0) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          return false; // return false to indicate timer should stop
        }
        
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        return true;
      };

      // Chạy ngay lần đầu tiên để tránh bị delay 1 giây
      const isStillRunning = updateTimer();
      
      if (isStillRunning) {
        const timer = setInterval(() => {
          const keepRunning = updateTimer();
          if (!keepRunning) {
            clearInterval(timer);
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [product]);


  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const res = await http.get(`/api/Product/${id}`);
        setProduct(res.data);

        if (res.data) {
          const allVars = [res.data, ...(res.data.products || [])];
          const availableVar = allVars.find(v => v.stockQuantity > 0) || res.data;

          setMainImage(availableVar.imageUrl || res.data.imageUrl);
          setSelectedColor(availableVar.color);
          setSelectedSize(availableVar.size);
          
          // Sync with local favorites initially
          setIsFav(isFavorite(res.data.productId));
          
          // Accurately check with backend if logged in
          const token = localStorage.getItem('accessToken');
          if (token) {
            http.get<string[]>('/api/Favorite/my-favorites').then(favRes => {
              const isFavDb = favRes.data.includes(res.data.productId);
              setIsFav(isFavDb);
              localStorage.setItem('favorite_ids', JSON.stringify(favRes.data));
            }).catch(() => {});
          }
        }
      } catch (error) {
        message.error(String(error));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  // Fetch FBT Products separately so it doesn't block main page load
  useEffect(() => {
    const fetchFBT = async () => {
      setFbtLoading(true);
      try {
        const fbtRes = await http.get(`/api/Product/${id}/frequently-bought-together`);
        setFbtProducts(fbtRes.data || []);
      } catch (e) {
        console.error('Failed to fetch FBT products:', e);
        setFbtProducts([]);
      } finally {
        setFbtLoading(false);
      }
    };

    if (id) {
      fetchFBT();
    }
  }, [id]);

  // --- REVIEWS STATE & FETCH ---
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsData, setReviewsData] = useState<{totalReviews: number, averageRating: number}>({ totalReviews: 0, averageRating: 0 });

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await http.get(`/api/Review/product/${id}`);
        setReviews(res.data.reviews || []);
        setReviewsData({
          totalReviews: res.data.totalReviews || 0,
          averageRating: res.data.averageRating || 0
        });
      } catch (error) {
        console.error('Failed to fetch reviews', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  // AI Tracking: Sản phẩm xem lâu (5 giây)
  useEffect(() => {
    if (!product || !id) return;
    
    const timer = setTimeout(async () => {
      addAIHistory(id);
      console.log('AI History: Added viewed product', id);
      
      // Call BE to log the interaction (1 = View > 5s, Score = 1)
      try {
        console.log('Sending track-view API...');
        await http.post(`/api/Product/${id}/track-view`, {
          durationInSeconds: 5
        });
        console.log('Track-view API sent successfully');
      } catch (err) {
        console.error('Failed to log AI interaction', err);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [product, id]);

  const allVariants = product ? [
    {
      productId: product.productId,
      size: product.size,
      color: product.color,
      stockQuantity: product.stockQuantity,
      price: product.price,
      originalPrice: product.originalPrice,
      imageUrl: product.imageUrl
    },
    ...(product.products || [])
  ] : [];

  const colors = Array.from(new Set(allVariants.map((v) => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(allVariants.map((v) => v.size).filter(Boolean)));

  const currentVariant = product ? (allVariants.find((v) => v.color === selectedColor && v.size === selectedSize) || allVariants[0]) : null;

  const handleBuyNow = async () => {
    if (!currentVariant) {
      message.error('Please select product variant');
      return;
    }

    try {
      // 1. Thêm vào giỏ hàng
      await http.post('/api/Cart', {
        productId: currentVariant.productId,
        variantId: currentVariant.variantId,
        quantity: quantity
      });
      
      window.dispatchEvent(new Event('cart-updated'));
      addAIHistory(currentVariant.productId);

      // 2. Lấy danh sách giỏ hàng để tìm ID của item vừa được thêm
      const cartRes = await http.get('/api/Cart');
      
      // Tìm item vừa thêm dựa trên id và phân loại
      const addedItem = cartRes.data.find((item: any) => 
        item.product.productId === currentVariant.productId &&
        item.product.color === currentVariant.color &&
        item.product.size === currentVariant.size
      );

      if (addedItem) {
        navigate('/checkout', { state: { selectedRowKeys: [addedItem.id] } });
      } else {
        message.error('Error preparing order');
      }
    } catch (error: any) {
      message.error(error.message || 'Please log in to purchase!');
    }
  };

  useEffect(() => {
    if (location.state?.autoBuy && allVariants.length > 0 && currentVariant) {
      handleBuyNow();
      // Clear state to prevent loop
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [allVariants.length, currentVariant, location.state, location.pathname, navigate]);

  if (loading) {
    return (
      <div className='max-w-[1200px] mx-auto p-4 py-8'>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className='flex justify-center items-center h-96'>
        <p className='text-gray-500 text-lg'>Product not found.</p>
      </div>
    );
  }

  // Biến chứa Giá và Tồn kho của phân loại đang chọn
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayOriginalPrice = currentVariant && currentVariant.originalPrice ? currentVariant.originalPrice : (product.originalPrice || 0);
  const displayStock = currentVariant ? currentVariant.stockQuantity : 0;

  const origins = ['VIETNAME', 'CHINA', 'SOUTH KOREA', 'JAPAN', 'USA', 'EUROPE'];
  const stableIndex = product.productId?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
  const productOrigin = product.origin || origins[stableIndex];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const variantWithColor = allVariants.find((v) => v.color === color);
    if (variantWithColor && variantWithColor.imageUrl) {
      setMainImage(variantWithColor.imageUrl);
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant) {
      message.error('Please select product variant');
      return;
    }

    try {
      await http.post('/api/Cart', {
        productId: currentVariant.productId,
        variantId: currentVariant.variantId,
        quantity: quantity
      });
      message.success(`Added ${quantity} item(s) to cart`);
      // Báo hiệu cho Header cập nhật giỏ hàng
      window.dispatchEvent(new Event('cart-updated'));
      
      // AI Tracking: Lưu vào lịch sử khi thêm giỏ hàng
      addAIHistory(currentVariant.productId);
      console.log('AI History: Added to cart', currentVariant.productId);
      
    } catch (error: any) {
      const errorMsg = typeof error.response?.data === 'string' ? error.response.data : error.response?.data?.message;
      message.error(errorMsg || error.message || 'Lỗi thêm vào giỏ hàng');
    }
  };

  const handleToggleFav = async () => {
    if (product) {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        message.error('Please log in to perform this action');
        return;
      }
      
      const newFavState = toggleFavorite(product.productId);
      setIsFav(newFavState);
      setProduct(prev => prev ? { 
        ...prev, 
        favoriteCount: Math.max(0, (prev.favoriteCount || 0) + (newFavState ? 1 : -1)) 
      } : null);
      message.success(newFavState ? 'Added to favorites' : 'Removed from favorites');
    }
  };

  const allThumbnails = Array.from(
    new Set([
      product.imageUrl,
      ...(product.products || []).map((v) => v.imageUrl)
    ].filter(Boolean))
  );

  const handleNext = () => {
    if (startIndex + 5 < allThumbnails.length) {
      setStartIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex(prev => prev - 1);
    }
  };

  const visibleThumbnails = allThumbnails.slice(startIndex, startIndex + 5);

  return (
    <div className='bg-[#f5f5f5] min-h-screen pb-12 w-full font-sans overflow-x-auto'>
      <style>{`
        .variant-selected-tick {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 15px;
          height: 15px;
          background: #ee4d2d;
          clip-path: polygon(100% 0, 100% 100%, 0 100%);
        }
        .variant-selected-tick::after {
          content: '✔';
          position: absolute;
          bottom: -1px;
          right: 1px;
          color: white;
          font-size: 8px;
        }
        .quantity-input:focus {
          outline: none;
        }
      `}</style>

      {/* Breadcrumb */}
      <div className='max-w-[1200px] mx-auto px-4 py-4 text-[13px]'>
        <Breadcrumb separator={<RightOutlined className='text-[10px] text-gray-400' />}>
          <Breadcrumb.Item>
            <Link to='/' className='text-[#05a] hover:text-[#ee4d2d]'>
              Ecommerce
            </Link>
          </Breadcrumb.Item>
          {product.parentCategoryName && (
            <Breadcrumb.Item>
              <Link to='/' className='text-[#05a] hover:text-[#ee4d2d]'>
                {product.parentCategoryName}
              </Link>
            </Breadcrumb.Item>
          )}
          <Breadcrumb.Item>
            <Link to='/' className='text-[#05a] hover:text-[#ee4d2d]'>
              {product.categoryName}
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item className='text-gray-900 truncate max-w-[200px] inline-block align-bottom'>
            {product.productName}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className='max-w-[1200px] mx-auto px-4'>
        {/* KHỐI THÔNG TIN CHÍNH */}
        <div className='bg-white shadow-sm rounded-sm flex flex-row p-0 min-w-[900px]'>
          {/* CỘT TRÁI: Hình ảnh */}
          <div className='w-[400px] flex flex-col shrink-0 p-4'>
            <div className='w-full h-[400px] bg-gray-50 relative cursor-pointer border border-gray-100 mb-4 flex justify-center items-center overflow-hidden'>
              <Image
                src={getImageUrl(mainImage || product.imageUrl)}
                alt={product.productName}
                className='object-contain'
                style={{ maxWidth: '400px', maxHeight: '400px' }}
              />
            </div>
            {allThumbnails.length > 0 && (
              <div className='relative flex items-center group mb-2'>
                {allThumbnails.length > 5 && startIndex > 0 && (
                   <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-gray-200 shadow-sm w-5 h-8 flex items-center justify-center hover:bg-white hover:text-[#ee4d2d] transition-colors"><LeftOutlined className="text-[10px]" /></button>
                )}
                
                <div className='grid grid-cols-5 gap-2 flex-1 w-full'>
                  {visibleThumbnails.map((img, idx) => (
                    <div
                      key={startIndex + idx}
                      className={`aspect-square border-2 cursor-pointer ${mainImage === img ? 'border-[#ee4d2d]' : 'border-transparent hover:border-[#ee4d2d]'}`}
                      onMouseEnter={() => setMainImage(img)}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt='thumbnail'
                        className='w-full h-full object-cover'
                      />
                    </div>
                  ))}
                </div>

                {allThumbnails.length > 5 && startIndex + 5 < allThumbnails.length && (
                   <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 border border-gray-200 shadow-sm w-5 h-8 flex items-center justify-center hover:bg-white hover:text-[#ee4d2d] transition-colors"><RightOutlined className="text-[10px]" /></button>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Thông tin chi tiết */}
          <div className='flex-1 flex flex-col pt-6 pr-8 pb-8 pl-6'>
            {/* Tiêu đề & Mô tả ngắn */}
            <h1 className='text-[22px] font-medium text-gray-900 leading-snug mb-2'>{product.productName}</h1>

            <div className='flex items-center gap-4 text-[14px] mb-4 text-gray-600'>
              {reviewsData.totalReviews > 0 ? (
                <>
                  <div className='flex items-center gap-1 text-[#ee4d2d]'>
                    <span className='underline font-medium border-b border-[#ee4d2d] leading-none pb-0.5'>
                      {Number(reviewsData.averageRating).toFixed(1)}
                    </span>
                    <div className='flex text-[#ee4d2d]'>
                      {[...Array(5)].map((_, i) => <StarFilled key={i} className='text-[12px]' />)}
                    </div>
                  </div>
                  <div className='w-[1px] h-[14px] bg-gray-300'></div>
                  <div className='flex items-center gap-1'>
                    <span className='underline font-medium text-gray-900'>{reviewsData.totalReviews}</span> Reviews
                  </div>
                </>
              ) : (
                <div className='flex items-center gap-1 text-gray-500'>
                  No reviews yet
                </div>
              )}
              <div className='w-[1px] h-[14px] bg-gray-300'></div>
              <div className='flex items-center gap-1'>
                <span className='text-gray-900 font-medium'>{product.soldQuantity || 0}</span> Sold
              </div>
              <div className='w-[1px] h-[14px] bg-gray-300'></div>
              <div className='flex items-center gap-1 text-gray-500'>
                <HeartFilled className={product.favoriteCount && product.favoriteCount > 0 ? 'text-[#ee4d2d]' : 'text-gray-400'} /> Liked ({product.favoriteCount !== undefined ? product.favoriteCount : 0})
              </div>
            </div>

            <div className='text-[14px] text-gray-500 leading-relaxed mb-4 line-clamp-2'>
              {product.description || 'No detailed description available for this product.'}
            </div>

            {/* Thông tin Xuất xứ & Loại vải */}
            <div className="flex gap-8 mb-4 text-[14px] text-gray-600 bg-gray-50 p-3 rounded-sm border border-gray-100">
              <div><span className="font-medium text-gray-800">Origin:</span> {productOrigin}</div>
              {product.fabricType && (
                <div><span className="font-medium text-gray-800">Fabric Type:</span> {product.fabricType}</div>
              )}
            </div>

            {/* Bảng Giá */}
            {isFlashSaleActive && (
              <div className='bg-[#f05d40] flex items-center justify-between px-5 py-2.5 rounded-t-sm'>
                <div className='text-white font-bold text-xl italic flex items-center gap-1 tracking-wider'>
                  <span className='text-yellow-300 mr-1'>⚡</span> FLASH SALE
                </div>
                <div className='flex items-center gap-2 text-white text-[13px]'>
                  <span><ClockCircleOutlined /> ENDS IN</span>
                  <div className='flex gap-1 ml-1'>
                    <span className='bg-black text-white px-1.5 py-0.5 rounded-sm text-sm font-bold'>{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className='bg-black text-white px-1.5 py-0.5 rounded-sm text-sm font-bold'>{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className='bg-black text-white px-1.5 py-0.5 rounded-sm text-sm font-bold'>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            )}
            <div className={`bg-[#fafafa] px-5 py-4 flex flex-col mb-8 ${product.discountPercentage && product.discountPercentage >= 15 ? 'rounded-b-sm' : 'rounded-sm'}`}>
              <div className='flex items-center gap-4'>
                <div className='text-[#ee4d2d] text-[32px] font-medium flex items-start leading-none'>
                  {new Intl.NumberFormat('vi-VN').format(displayPrice)}<span className='text-[18px] mt-1 ml-0.5 underline'>đ</span>
                </div>
                {displayOriginalPrice > displayPrice && (
                  <div className='text-gray-400 text-[16px] line-through flex items-start leading-none'>
                    {new Intl.NumberFormat('vi-VN').format(displayOriginalPrice)}<span className='text-[12px] mt-0.5 ml-0.5 underline'>đ</span>
                  </div>
                )}
                {product.discountPercentage ? (
                  <div className='text-[#ee4d2d] text-xs font-bold bg-[#fceade] px-1.5 py-0.5 rounded-sm uppercase'>
                    -{product.discountPercentage}%
                  </div>
                ) : null}
              </div>
            </div>

            {/* Khu vực chọn Phân loại (Màu, Size, Số lượng) */}
            <div className='flex flex-col gap-6 text-[14px] mb-8'>
              {/* Chọn Màu Sắc */}
              {colors.length > 0 && (
                <div className='flex items-start'>
                  <div className='w-[110px] text-gray-500 mt-2 shrink-0 capitalize'>Color</div>
                  <div className='flex flex-wrap gap-2 flex-1'>
                    {colors.map((color) => {
                      const variantImg = allVariants.find((v) => v.color === color)?.imageUrl;
                      const isColorOutOfStock = allVariants.filter(v => v.color === color).every(v => v.stockQuantity === 0);
                      
                      return (
                        <button
                          key={color}
                          disabled={isColorOutOfStock}
                          onClick={() => handleColorSelect(color)}
                          className={`relative flex items-center gap-2 px-3 py-1.5 border rounded-sm min-w-[80px] transition-all outline-none ${
                            selectedColor === color
                              ? 'border-[#ee4d2d] text-[#ee4d2d] bg-white'
                              : isColorOutOfStock
                              ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] bg-white'
                          }`}
                        >
                          {variantImg && (
                            <img
                              src={getImageUrl(variantImg)}
                              className='w-6 h-6 object-cover border border-gray-100'
                              alt={color}
                            />
                          )}
                          <span className='text-left'>{color}</span>
                          {selectedColor === color && <div className='variant-selected-tick'></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chọn Kích Cỡ */}
              {sizes.length > 0 && (
                <div className='flex items-start'>
                  <div className='w-[110px] text-gray-500 mt-2 shrink-0 capitalize'>
                    Size
                  </div>
                  <div className='flex flex-wrap gap-2 flex-1 items-center'>
                    {sizes.map((size) => {
                      const matchingVariants = selectedColor ? allVariants.filter(v => v.color === selectedColor && v.size === size) : allVariants.filter(v => v.size === size);
                      const isSizeOutOfStock = matchingVariants.length === 0 || matchingVariants.every(v => v.stockQuantity === 0);

                      return (
                        <button
                          key={size}
                          disabled={isSizeOutOfStock}
                          onClick={() => setSelectedSize(size)}
                          className={`relative px-4 py-1.5 border rounded-sm min-w-[80px] text-center transition-all outline-none ${
                            selectedSize === size
                              ? 'border-[#ee4d2d] text-[#ee4d2d] bg-white'
                              : isSizeOutOfStock
                              ? 'border-gray-200 text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] bg-white'
                          }`}
                        >
                        {size}
                        {selectedSize === size && <div className='variant-selected-tick'></div>}
                      </button>
                    );
                    })}
                    <button 
                      onClick={() => setIsSizeGuideVisible(true)}
                      className="text-[#ee4d2d] hover:underline text-[14px] bg-transparent border-none cursor-pointer p-0 ml-2 font-medium"
                    >
                      Size Guide
                    </button>
                  </div>
                </div>
              )}

              {/* Chọn Số Lượng */}
              <div className='flex items-center mt-2'>
                <div className='w-[110px] text-gray-500 shrink-0 capitalize'>Quantity</div>
                <div className='flex items-center'>
                  <div className='flex border border-gray-300 rounded-sm overflow-hidden'>
                    <button
                      className='w-8 h-8 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50 border-r border-gray-300 cursor-pointer'
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </button>
                    <input
                      type='text'
                      value={quantity}
                      onChange={(e) => {
                        let val = Number(e.target.value) || 1;
                        if (val > displayStock) val = displayStock;
                        setQuantity(val);
                      }}
                      className='w-14 h-8 text-center border-none text-[14px] quantity-input m-0 p-0 text-gray-800'
                    />
                    <button
                      className='w-8 h-8 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50 border-l border-gray-300 cursor-pointer'
                      onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    >
                      +
                    </button>
                  </div>
                  <div className='text-gray-500 text-[14px] ml-5'>{displayStock} pieces available</div>
                </div>
              </div>
            </div>

            {/* Các Nút Hành Động */}
            <div className='flex items-center gap-4 mt-auto pt-6 border-t border-gray-100'>
              <Button
                size='large'
                icon={<ShoppingCartOutlined className='text-[20px]' />}
                className='h-[48px] px-6 rounded-sm border-[#ee4d2d] bg-[#ffeceb] text-[#ee4d2d] font-medium text-[15px] hover:!bg-[#fdf0f0] hover:!border-[#ee4d2d] hover:!text-[#ee4d2d] shadow-none flex items-center gap-2'
                onClick={handleAddToCart}
              >
                Add To Cart
              </Button>
              <Button
                size='large'
                className='h-[48px] px-8 rounded-sm bg-[#ee4d2d] text-white font-medium text-[15px] hover:!bg-[#f05d40] hover:!text-white border-none shadow-sm'
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'admin',
                      label: 'Live Support (Admin)',
                      icon: <UserOutlined />,
                      onClick: () => {
                        const url = window.location.origin + `/product/${product.productId}`;
                        window.dispatchEvent(new CustomEvent('share-to-live-chat', { 
                          detail: { 
                            productUrl: url,
                            product: {
                              id: product.productId,
                              name: product.productName,
                              price: displayPrice,
                              originalPrice: displayOriginalPrice,
                              image: mainImage || product.imageUrl
                            }
                          } 
                        }));
                      }
                    },
                    {
                      key: 'ai',
                      label: 'Chat with AI Chatbot',
                      icon: <RobotOutlined />,
                      onClick: () => {
                        const url = window.location.origin + `/product/${product.productId}`;
                        window.dispatchEvent(new CustomEvent('share-to-chat', { 
                          detail: { 
                            productUrl: url,
                            product: {
                              id: product.productId,
                              name: product.productName,
                              price: displayPrice,
                              originalPrice: displayOriginalPrice,
                              image: mainImage || product.imageUrl
                            }
                          } 
                        }));
                      }
                    }
                  ]
                }}
                placement="bottom"
              >
                <Button
                  size='large'
                  icon={<MessageOutlined className='text-[20px]' />}
                  className='h-[48px] px-6 rounded-sm border-gray-300 bg-white text-gray-700 font-medium text-[15px] hover:!border-[#ee4d2d] hover:!text-[#ee4d2d] shadow-none flex items-center gap-2'
                >
                  Message
                </Button>
              </Dropdown>
              <Button
                size='large'
                icon={isFav ? <HeartFilled className='text-blue-500 text-[20px]' /> : <HeartOutlined className='text-gray-500 text-[20px] group-hover:text-blue-500' />}
                onClick={handleToggleFav}
                className={`h-[48px] w-[48px] rounded-sm shadow-none flex items-center justify-center border-gray-300 group ${isFav ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500 hover:bg-gray-50'}`}
              />
            </div>
          </div>
        </div>

        {/* Thường được mua cùng (FBT) */}
        {(fbtLoading || (fbtProducts && fbtProducts.length > 0)) && (
          <div className='mt-4 bg-white p-6 shadow-sm rounded-sm min-h-[300px]'>
            <div className='text-lg font-medium text-gray-800 mb-6 uppercase'>Frequently Bought Together</div>
            {fbtLoading ? (
              <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className='bg-white border border-gray-100 rounded-sm p-3'>
                    <Skeleton.Image className='w-full !h-auto aspect-[3/4] mb-3' active />
                    <Skeleton active paragraph={{ rows: 2 }} title={false} />
                  </div>
                ))}
              </div>
            ) : (
              <div className='grid grid-cols-6 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                {fbtProducts.map((p) => (
                  <Link to={`/product/${p.productId}`} key={p.productId} className='block group'>
                    <div className='bg-white border border-gray-100 hover:border-[#ee4d2d] hover:-translate-y-1 hover:shadow-md transition-all duration-300 rounded-sm overflow-hidden relative'>
                      <div className='aspect-[3/4] overflow-hidden bg-gray-50'>
                        <img src={getImageUrl(p.imageUrl)} alt={p.productName} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' />
                      </div>
                      <div className='p-3'>
                        <div className='text-sm text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-[#ee4d2d] transition-colors'>{p.productName}</div>
                        <div className='mt-2 flex items-center justify-between'>
                          <div className='flex items-baseline gap-2'>
                            <span className='text-[#ee4d2d] font-medium'>
                              {p.price.toLocaleString('vi-VN')}₫
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className='text-xs text-gray-400 line-through'>
                                {p.originalPrice.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ĐÁNH GIÁ SẢN PHẨM                                                         */}
        {/* ========================================================================= */}
        <div className='mt-4 bg-white shadow-sm rounded-sm p-6 mb-8'>
          <div className='text-lg font-medium text-gray-800 mb-6 uppercase'>Product Reviews</div>

          {reviewsLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : (
            <>
              {/* Tổng quan đánh giá */}
              <div className='flex items-center gap-8 bg-[#fffbf8] border border-[#f9ede5] p-6 rounded-sm mb-6'>
                <div className='flex flex-col items-center justify-center'>
                  <div className='text-[#ee4d2d] text-3xl font-medium'>
                    <span className='text-[1.5rem]'>{reviewsData.averageRating}</span> / 5
                  </div>
                  <Rate disabled value={reviewsData.averageRating} allowHalf className='text-[#ee4d2d] text-lg mt-1' />
                </div>
                <div className='text-gray-600'>
                  {reviewsData.totalReviews} reviews
                </div>
              </div>

              {/* Danh sách bình luận */}
              {reviews.length === 0 ? (
                <div className='text-center text-gray-500 py-8'>No reviews for this product yet.</div>
              ) : (
                <div className='flex flex-col'>
                  {reviews.map((review) => (
                    <div key={review.id} className='flex gap-4 py-4 border-b border-gray-100 last:border-0'>
                      <Avatar src={review.avatarUrl} icon={<UserOutlined />} className='w-10 h-10 shrink-0' />
                      <div className='flex flex-col flex-1'>
                        <div className='font-medium text-[13px] text-gray-800'>{review.userName}</div>
                        <Rate disabled value={review.rating} className='text-[#ee4d2d] text-[12px] my-1' />
                        <div className='text-gray-400 text-[12px] mb-3'>
                          {new Date(review.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <div className='text-[14px] text-gray-800 whitespace-pre-wrap'>{review.comment}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
      <Modal
        title="Size Guide"
        open={isSizeGuideVisible}
        onCancel={() => setIsSizeGuideVisible(false)}
        footer={null}
        width={600}
        centered
      >
        <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto p-2">
          <div>
            <div className="text-center font-medium mb-2">Men's Size Guide</div>
            <img src="https://res.cloudinary.com/dss8hptah/image/upload/v1/size_nam.png" alt="Size Nam" className="w-full max-h-[35vh] object-contain rounded-md border border-gray-200" />
          </div>
          <div>
            <div className="text-center font-medium mb-2">Women's Size Guide</div>
            <img src="https://res.cloudinary.com/dss8hptah/image/upload/v1/size_nu.png" alt="Size Nữ" className="w-full max-h-[35vh] object-contain rounded-md border border-gray-200" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetail;
