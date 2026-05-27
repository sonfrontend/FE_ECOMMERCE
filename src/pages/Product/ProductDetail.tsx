import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumb, Button, Skeleton, message, Image } from 'antd';
import { ShoppingCartOutlined, RightOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import http from '@/apis/http';
import { addAIHistory } from '@/utils/aiHistory';
import { isFavorite, toggleFavorite } from '@/utils/favorite';

interface ProductVariant {
  articleId: string;
  size: string;
  color: string;
  stockQuantity: number;
  price: number;
  imageUrl: string;
}

interface ProductDetailData {
  articleId: string;
  productCode: string;
  categoryId: number;
  categoryName: string;
  parentCategoryName?: string;
  productName: string;
  price: number;
  imageUrl: string;
  description: string;
  size: string;
  color: string;
  stockQuantity: number;
  products: ProductVariant[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [isFav, setIsFav] = useState<boolean>(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const res = await http.get(`/api/Product/${id}`);
        setProduct(res.data);

        if (res.data) {
          setMainImage(res.data.imageUrl);
          setSelectedColor(res.data.color);
          setSelectedSize(res.data.size);
          setIsFav(isFavorite(res.data.articleId));
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

  // AI Tracking: Sản phẩm xem lâu (5 giây)
  useEffect(() => {
    if (!product) return;
    
    const timer = setTimeout(() => {
      addAIHistory(product.articleId);
      console.log('AI History: Added viewed product', product.articleId);
    }, 5000);

    return () => clearTimeout(timer);
  }, [product]);

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
        <p className='text-gray-500 text-lg'>Không tìm thấy sản phẩm.</p>
      </div>
    );
  }

  const allVariants = [
    {
      articleId: product.articleId,
      size: product.size,
      color: product.color,
      stockQuantity: product.stockQuantity,
      price: product.price,
      imageUrl: product.imageUrl
    },
    ...(product.products || [])
  ];

  const colors = Array.from(new Set(allVariants.map((v) => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(allVariants.map((v) => v.size).filter(Boolean)));

  const currentVariant =
    allVariants.find((v) => v.color === selectedColor && v.size === selectedSize) || allVariants[0];

  // Biến chứa Giá và Tồn kho của phân loại đang chọn
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayStock = currentVariant ? currentVariant.stockQuantity : 0;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const variantWithColor = allVariants.find((v) => v.color === color);
    if (variantWithColor && variantWithColor.imageUrl) {
      setMainImage(variantWithColor.imageUrl);
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant) {
      message.error('Vui lòng chọn phân loại hàng');
      return;
    }

    try {
      await http.post('/api/Cart', {
        articleId: currentVariant.articleId,
        quantity: quantity
      });
      message.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
      // Báo hiệu cho Header cập nhật giỏ hàng
      window.dispatchEvent(new Event('cart-updated'));
      
      // AI Tracking: Lưu vào lịch sử khi thêm giỏ hàng
      addAIHistory(currentVariant.articleId);
      console.log('AI History: Added to cart', currentVariant.articleId);
      
    } catch (error) {
      message.error(error.message || 'Vui lòng đăng nhập để thêm vào giỏ hàng!');
    }
  };

  const handleToggleFav = () => {
    if (product) {
      const newState = toggleFavorite(product.articleId);
      setIsFav(newState);
    }
  };

  const thumbnails = [
    product.imageUrl,
    ...(product.products || [])
      .map((v) => v.imageUrl)
      .filter((img) => img !== product.imageUrl)
      .slice(0, 4)
  ];

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
                src={'http://localhost:5000/images/' + (mainImage || product.imageUrl)}
                alt={product.productName}
                className='object-contain'
                style={{ maxWidth: '400px', maxHeight: '400px' }}
              />
            </div>
            {thumbnails.length > 0 && (
              <div className='grid grid-cols-5 gap-2 mb-2'>
                {thumbnails.map((img, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square border-2 cursor-pointer ${mainImage === img ? 'border-[#ee4d2d]' : 'border-transparent hover:border-[#ee4d2d]'}`}
                    onMouseEnter={() => setMainImage(img)}
                  >
                    <img
                      src={'http://localhost:5000/images/' + img}
                      alt='thumbnail'
                      className='w-full h-full object-cover'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Thông tin chi tiết */}
          <div className='flex-1 flex flex-col pt-6 pr-8 pb-8 pl-6'>
            {/* Tiêu đề & Mô tả ngắn */}
            <h1 className='text-[22px] font-medium text-gray-900 leading-snug mb-2'>{product.productName}</h1>

            <div className='text-[14px] text-gray-500 leading-relaxed mb-4 line-clamp-2'>
              {product.description || 'Sản phẩm hiện chưa có mô tả chi tiết.'}
            </div>

            {/* Bảng Giá (Đã được thêm lại và style nổi bật) */}
            <div className='bg-[#fafafa] px-5 py-4 flex items-center gap-4 mb-8 rounded-sm'>
              <div className='text-[#ee4d2d] text-[32px] font-medium flex items-start leading-none'>
                <span className='text-[18px] mt-1 mr-1 underline'>đ</span>
                {new Intl.NumberFormat('vi-VN').format(displayPrice)}
              </div>
            </div>

            {/* Khu vực chọn Phân loại (Màu, Size, Số lượng) */}
            <div className='flex flex-col gap-6 text-[14px] mb-8'>
              {/* Chọn Màu Sắc */}
              {colors.length > 0 && (
                <div className='flex items-start'>
                  <div className='w-[110px] text-gray-500 mt-2 shrink-0 capitalize'>Màu sắc</div>
                  <div className='flex flex-wrap gap-2 flex-1'>
                    {colors.map((color) => {
                      const variantImg = allVariants.find((v) => v.color === color)?.imageUrl;
                      return (
                        <button
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`relative flex items-center gap-2 px-3 py-1.5 border rounded-sm min-w-[80px] bg-white transition-all outline-none ${
                            selectedColor === color
                              ? 'border-[#ee4d2d] text-[#ee4d2d]'
                              : 'border-gray-200 text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d]'
                          }`}
                        >
                          {variantImg && (
                            <img
                              src={'http://localhost:5000/images/' + variantImg}
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
                  <div className='w-[110px] text-gray-500 mt-2 shrink-0 capitalize'>Kích cỡ</div>
                  <div className='flex flex-wrap gap-2 flex-1'>
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`relative px-4 py-1.5 border rounded-sm min-w-[80px] text-center transition-all outline-none ${
                          selectedSize === size
                            ? 'border-[#ee4d2d] text-[#ee4d2d]'
                            : 'border-gray-200 text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d]'
                        }`}
                      >
                        {size}
                        {selectedSize === size && <div className='variant-selected-tick'></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chọn Số Lượng */}
              <div className='flex items-center mt-2'>
                <div className='w-[110px] text-gray-500 shrink-0 capitalize'>Số lượng</div>
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
                      onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                      className='w-14 h-8 text-center border-none text-[14px] quantity-input m-0 p-0 text-gray-800'
                    />
                    <button
                      className='w-8 h-8 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-50 border-l border-gray-300 cursor-pointer'
                      onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    >
                      +
                    </button>
                  </div>
                  <div className='text-gray-500 text-[14px] ml-5'>{displayStock} sản phẩm có sẵn</div>
                </div>
              </div>
            </div>

            {/* Các Nút Hành Động (Được đẩy xuống đáy bằng mt-auto và có khoảng cách chuẩn) */}
            <div className='flex items-center gap-4 mt-auto pt-6 border-t border-gray-100'>
              <Button
                size='large'
                icon={<ShoppingCartOutlined className='text-[20px]' />}
                className='h-[48px] px-6 rounded-sm border-[#ee4d2d] bg-[#ffeceb] text-[#ee4d2d] font-medium text-[15px] hover:!bg-[#fdf0f0] hover:!border-[#ee4d2d] hover:!text-[#ee4d2d] shadow-none flex items-center gap-2'
                onClick={handleAddToCart}
              >
                Thêm Vào Giỏ Hàng
              </Button>
              <Button
                size='large'
                className='h-[48px] min-w-[180px] rounded-sm bg-[#ee4d2d] text-white border-none font-medium text-[15px] hover:!bg-[#f05d40] hover:!text-white shadow-sm'
              >
                Mua Ngay
              </Button>
              <Button
                size='large'
                icon={isFav ? <HeartFilled className='text-[#ee4d2d] text-[20px]' /> : <HeartOutlined className='text-gray-500 text-[20px] group-hover:text-[#ee4d2d]' />}
                onClick={handleToggleFav}
                className={`h-[48px] w-[48px] rounded-sm shadow-none flex items-center justify-center border-gray-300 group ${isFav ? 'border-[#ee4d2d] bg-[#ffeceb]' : 'hover:border-[#ee4d2d] hover:bg-gray-50'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
