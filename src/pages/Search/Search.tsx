import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { Typography, Button, Skeleton, message, Select } from 'antd';
import { LeftOutlined, RightOutlined, PictureOutlined, SearchOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import http from '@/apis/http';
import { getFavorites, toggleFavorite } from '@/utils/favorite';

const { Text } = Typography;

interface Product {
  articleId: string;
  productCode: string;
  productName: string;
  price: number;
  imageUrl: string;
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const query = searchParams.get('q');
  const isImageSearch = searchParams.get('image') === 'true';
  const imageProducts = location.state?.products || [];

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(getFavorites());

  // --- INTERSECTION OBSERVER (CUỘN TRANG INFINITE SCROLL) ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = useCallback(
    (node: HTMLAnchorElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver((entries) => {
        // Khi người dùng cuộn tới phần tử cuối cùng và vẫn còn dữ liệu -> Tăng page lên 1
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // --- LOGIC 1: RESET DỮ LIỆU KHI THAY ĐỔI TỪ KHÓA HOẶC SẮP XẾP ---
  useEffect(() => {
    setPage(1);
    setProducts([]); // Làm trống màn hình ngay lập tức để tạo cảm giác phản hồi nhanh
  }, [query, isImageSearch, sortOrder]);

  // --- LOGIC 2: GỌI API TRỰC TIẾP TẠI ĐÂY ---
  useEffect(() => {
    let isSubscribed = true; // Cờ kiểm soát chống lỗi Race Condition khi gõ nhanh

    const fetchSearchResults = async () => {
      if (isImageSearch) {
        let finalProducts = [...imageProducts];
        if (sortOrder === 'asc') finalProducts.sort((a,b) => a.price - b.price);
        else if (sortOrder === 'desc') finalProducts.sort((a,b) => b.price - a.price);
        
        setProducts(finalProducts);
        setHasMore(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Tự động build URL tùy thuộc vào việc có từ khóa hay không
        let apiUrl = `/api/Product?page=${page}&pageSize=15`;
        if (query) {
          apiUrl += `&search=${encodeURIComponent(query)}`;
        }
        if (sortOrder) {
          apiUrl += `&sortPrice=${sortOrder}`;
        }

        // 2. Gọi thẳng lên Backend
        const res = await http.get(apiUrl);
        
        if (!isSubscribed) return; // Hủy cập nhật nếu khách đã đổi từ khóa khác

        const { data, hasMore: more } = res.data;

        setProducts((prev) => {
          // Nếu đang ở trang 1 -> Ghi đè mới hoàn toàn
          if (page === 1) return data;
          
          // Nếu ở trang 2 trở đi -> Nối dữ liệu vào cuối danh sách hiện tại
          return [...prev, ...data];
        });

        setHasMore(more);

      } catch (error: any) {
        if (isSubscribed) {
          message.error(error.response?.data || "Có lỗi xảy ra khi tải kết quả tìm kiếm");
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchSearchResults();

    // Dọn dẹp khi component unmount hoặc chuẩn bị chạy lại effect
    return () => {
      isSubscribed = false;
    };
  }, [page, query, isImageSearch, sortOrder]);

  const handleToggleFav = (e: React.MouseEvent, articleId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(articleId);
    setFavorites(getFavorites());
  };

  // --- GIAO DIỆN COMPONENT SẢN PHẨM ---
  const renderProductCard = (product: Product, index: number, isLast: boolean) => {
    return (
      <Link
        to={`/product/${product.productCode}`}
        key={product.articleId + '-' + index}
        ref={isLast ? lastProductElementRef : null} // Gắn cờ vào sản phẩm cuối cùng để load thêm
        className='group flex flex-col cursor-pointer border border-gray-200 shadow-sm hover:border-[#ee4d2d] hover:-translate-y-1 hover:shadow-md transition-all duration-300 bg-white relative rounded-md overflow-hidden'
      >
        <div className='relative w-full aspect-[3/4] overflow-hidden bg-[#f5f5f5]'>
          <img
            alt={product.productName}
            src={'http://localhost:5000/images/' + product.imageUrl}
            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
          {/* Nút Yêu thích (Trái tim) */}
          <div 
            className='absolute top-2 right-2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-white transition-all z-10'
            onClick={(e) => handleToggleFav(e, product.articleId)}
          >
            {favorites.includes(product.articleId) ? (
              <HeartFilled className='text-[#ee4d2d] text-lg' />
            ) : (
              <HeartOutlined className='text-gray-500 text-lg hover:text-[#ee4d2d]' />
            )}
          </div>
        </div>
        <div className='flex flex-col text-left p-2 flex-1'>
          <Text className='text-gray-800 font-normal text-[13px] leading-tight line-clamp-2 mb-1.5 min-h-[36px]'>
            {product.productName}
          </Text>
          <div className='flex items-center justify-between mt-auto pt-1'>
            <Text className='text-[#ee4d2d] font-medium text-base'>
              <span className='text-xs mr-0.5 underline'>đ</span>
              {new Intl.NumberFormat('vi-VN').format(product.price)}
            </Text>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className='bg-[#f5f5f5] w-full min-h-screen pb-16'>
      <div className='max-w-[1200px] mx-auto px-4 py-8'>
        
        {/* HEADER KẾT QUẢ TÌM KIẾM */}
        <div className='bg-white p-4 mb-6 shadow-sm rounded-sm flex items-center justify-between'>
          <div className='flex items-center gap-2 text-lg font-medium text-gray-800'>
            {isImageSearch ? (
              <>
                <PictureOutlined className='text-[#ee4d2d] text-2xl' />
                <span>Kết quả tìm kiếm bằng hình ảnh</span>
              </>
            ) : query ? (
              <>
                <SearchOutlined className='text-[#ee4d2d]' />
                <span>
                  Kết quả tìm kiếm cho từ khoá: <span className='text-[#ee4d2d] font-bold'>"{query}"</span>
                </span>
              </>
            ) : (
              <span>Tất cả sản phẩm</span>
            )}
          </div>
        </div>

        {/* BỘ LỌC VÀ SẮP XẾP */}
        <div className='flex flex-wrap items-center justify-between bg-white p-3 mb-4 shadow-sm rounded-sm text-sm border-b border-gray-100'>
          <div className='flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0'>
            <span className='text-gray-600 mr-2 whitespace-nowrap'>Sắp xếp theo</span>
            <Button 
              type={!sortOrder ? 'primary' : 'default'}
              onClick={() => setSortOrder(null)}
              className={!sortOrder ? 'bg-[#ee4d2d] hover:!bg-[#ee4d2d]/90 border-none rounded-sm px-5 h-8 font-medium' : 'rounded-sm px-5 h-8 border-gray-200 bg-white hover:border-[#ee4d2d] hover:text-[#ee4d2d]'}
            >
              Liên quan
            </Button>
            <Select
              placeholder='Giá'
              value={sortOrder || undefined}
              onChange={(val) => setSortOrder(val)}
              allowClear
              className='w-40 h-8'
              options={[
                { value: 'asc', label: 'Giá: Thấp đến Cao' },
                { value: 'desc', label: 'Giá: Cao đến Thấp' }
              ]}
            />
          </div>
          <div className='hidden md:flex items-center gap-3 ml-auto'>
            <div className='flex rounded-sm overflow-hidden border border-gray-200 shadow-sm'>
              <Button type='text' disabled icon={<LeftOutlined className='text-xs' />} className='h-8 w-9 rounded-none border-r border-gray-200 bg-gray-50' />
              <Button type='text' icon={<RightOutlined className='text-xs' />} className='h-8 w-9 rounded-none bg-white hover:bg-gray-50' />
            </div>
          </div>
        </div>

        {/* DANH SÁCH SẢN PHẨM */}
        {products.length > 0 ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
            {products.map((p, i) => {
              const isLast = i === products.length - 1;
              return renderProductCard(p, i, isLast);
            })}
          </div>
        ) : (
          !loading && (
            <div className='flex flex-col items-center justify-center py-20 bg-white shadow-sm rounded-sm'>
              <SearchOutlined className='text-6xl text-gray-200 mb-4' />
              <div className='text-lg text-gray-500 font-medium'>
                Không tìm thấy sản phẩm nào khớp với tìm kiếm của bạn
              </div>
              <div className='text-gray-400 mt-2'>Vui lòng thử lại với từ khoá hoặc hình ảnh khác</div>
            </div>
          )
        )}

        {/* HIỆU ỨNG LOADING (SKELETON) */}
        {loading && (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3'>
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={`skel-${idx}`} className='flex flex-col bg-white shadow-sm rounded-sm pb-3'>
                <div className='w-full aspect-[3/4] mb-2'>
                  <Skeleton.Image active className='!w-full !h-full !rounded-none' />
                </div>
                <div className='px-2'>
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* THÔNG BÁO HẾT DỮ LIỆU */}
        <div className='flex justify-center mt-10 pb-8'>
          {!hasMore && products.length > 0 && (
            <Text className='text-gray-400 tracking-wider uppercase text-xs font-semibold'>Đã tải hết sản phẩm</Text>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Search;