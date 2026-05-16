import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Typography, Button, Skeleton, message, Select } from 'antd';
import { LeftOutlined, RightOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons';
import http from '@/apis/http';

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
  const query = searchParams.get('q');
  const isImageSearch = searchParams.get('image') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Intersection Observer cho Infinite Scroll
  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastProductElementRef = React.useCallback(
    (node: HTMLAnchorElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    // Reset khi thay đổi query tìm kiếm
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [query, isImageSearch]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        // Trong thực tế, bạn sẽ gọi endpoint tìm kiếm với từ khoá hoặc file ảnh
        // VD: /api/Product/Search?q=...
        // Hiện tại dùng tạm API lấy danh sách để giả lập kết quả
        const res = await http.get(`/api/Product?page=${page}&pageSize=15`);
        const { data, hasMore: more } = res.data;

        // Nếu là tìm kiếm text, lọc kết quả chứa từ khóa (Giả lập frontend filter)
        let filteredData = data;
        if (query) {
          const lowerQuery = query.toLowerCase();
          filteredData = data.filter((p: Product) => p.productName.toLowerCase().includes(lowerQuery));
        }

        setProducts((prev) => (page === 1 ? filteredData : [...prev, ...filteredData]));

        // Cập nhật hasMore: Nếu là tìm kiếm từ khoá thì có thể data ít nên tắt luôn
        if (query && filteredData.length < 15 && page === 1) {
          setHasMore(false);
        } else {
          setHasMore(more);
        }
      } catch (error) {
        message.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [page, query, isImageSearch]);

  const renderProductCard = (product: Product, index: number, isLast: boolean) => {
    return (
      <Link
        to={`/product/${product.productCode}`}
        key={product.articleId + '-' + index}
        ref={isLast ? lastProductElementRef : null}
        className='group flex flex-col cursor-pointer border border-transparent hover:border-[#ee4d2d] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-white relative rounded-sm overflow-hidden'
      >
        <div className='relative w-full aspect-[3/4] overflow-hidden bg-[#f5f5f5]'>
          <img
            alt={product.productName}
            src={'http://localhost:5000/images/' + product.imageUrl}
            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
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
        {/* Kết quả tìm kiếm header */}
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
          <div className='text-gray-500'>Tìm thấy {products.length}+ kết quả</div>
        </div>

        {/* Thanh sắp xếp */}
        <div className='flex flex-wrap items-center justify-between bg-white p-3 mb-4 shadow-sm rounded-sm text-sm border-b border-gray-100'>
          <div className='flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0'>
            <span className='text-gray-600 mr-2 whitespace-nowrap'>Sắp xếp theo</span>
            <Button
              type='primary'
              className='bg-[#ee4d2d] hover:!bg-[#ee4d2d]/90 border-none rounded-sm px-5 h-8 font-medium'
            >
              Liên quan
            </Button>
            <Button className='rounded-sm px-5 h-8 border-gray-200 bg-white hover:border-[#ee4d2d] hover:text-[#ee4d2d]'>
              Mới Nhất
            </Button>
            <Button className='rounded-sm px-5 h-8 border-gray-200 bg-white hover:border-[#ee4d2d] hover:text-[#ee4d2d]'>
              Bán Chạy
            </Button>
            <Select
              defaultValue='Giá'
              className='w-40 h-8'
              options={[
                { value: 'asc', label: 'Giá: Thấp đến Cao' },
                { value: 'desc', label: 'Giá: Cao đến Thấp' }
              ]}
            />
          </div>
          <div className='hidden md:flex items-center gap-3 ml-auto'>
            <div className='flex rounded-sm overflow-hidden border border-gray-200 shadow-sm'>
              <Button
                type='text'
                disabled
                icon={<LeftOutlined className='text-xs' />}
                className='h-8 w-9 rounded-none border-r border-gray-200 bg-gray-50'
              />
              <Button
                type='text'
                icon={<RightOutlined className='text-xs' />}
                className='h-8 w-9 rounded-none bg-white hover:bg-gray-50'
              />
            </div>
          </div>
        </div>

        {/* Lưới sản phẩm */}
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

        {/* Loading Indicators */}
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
