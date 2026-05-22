import React, { useState, useEffect } from 'react';
import { Typography, Button, Skeleton, message, Spin, Dropdown } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import type { MenuProps } from 'antd';

import http from '@/apis/http';

const { Text } = Typography;

interface Product {
  articleId: string;
  productCode: string;
  productName: string;
  price: number;
  imageUrl: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  subCategories?: Category[];
}

const ProductGrid: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // State quản lý Tab đang chọn trên thanh điều hướng
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'category'>(
    (searchParams.get('tab') as 'all' | 'recommended' | 'category') || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');

  // Lắng nghe sự thay đổi của searchParams (ví dụ khi người dùng click từ Header)
  useEffect(() => {
    const tab = (searchParams.get('tab') as 'all' | 'recommended' | 'category') || 'all';
    const category = searchParams.get('category') || 'all';

    let hasChanged = false;
    if (tab !== activeTab) {
      setActiveTab(tab);
      hasChanged = true;
    }
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      hasChanged = true;
    }

    if (hasChanged) {
      setPage(1);
      setProducts([]);
    }
  }, [searchParams]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  // Lấy danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http.get('/api/Category');
        let cats: Category[] = res.data;
        cats = cats.filter((cat) => cat.parentId === null || cat.parentId === undefined);
        setCategories(cats);
      } catch (error) {
        console.error('Lỗi khi tải danh mục', error);
      }
    };
    fetchCategories();
  }, []);

  // Lấy sản phẩm (Có thể thêm logic if(activeTab === 'recommended') gọi API AI ở đây sau này)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        let url = `/api/Product?page=${page}&pageSize=20`;
        if (activeTab === 'category' && selectedCategory !== 'all') {
          // Gọi API danh mục cha
          url = `/api/Product/parent-category/${selectedCategory}?page=${page}&pageSize=20`;
        }

        const res = await http.get(url);
        const { data, hasMore: more } = res.data;

        setProducts((prev) => (page === 1 ? data : [...prev, ...data]));
        setHasMore(more);
      } catch (error) {
        message.error(String(error));
        // FIX: Ngừng gọi API liên tục khi có lỗi (chống infinite loop)
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, activeTab, selectedCategory]);

  const handleCategorySelect: MenuProps['onClick'] = (e) => {
    setActiveTab('category');
    setSelectedCategory(e.key);
    setPage(1);
    setProducts([]);
    setSearchParams({ tab: 'category', category: e.key });
  };

  const handleTabChange = (tab: 'all' | 'recommended') => {
    setActiveTab(tab);
    setPage(1);
    setProducts([]);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  // Menu thả xuống cho nút Danh mục
  const categoryMenuItems: MenuProps['items'] = categories.map((cat) => ({
    key: cat.id.toString(),
    label: cat.name
  }));

  // Thẻ sản phẩm
  const renderProductCard = (product: Product, index: number, isLast: boolean) => {
    return (
      <Link
        to={`/product/${product.productCode}`}
        key={product.articleId + '-' + index}
        ref={isLast ? lastProductElementRef : null}
        className='group flex flex-col cursor-pointer border border-transparent hover:border-gray-300 hover:-translate-y-1 hover:shadow-[-12px_12px_20px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 bg-white relative rounded-sm overflow-hidden'
      >
        <div className='relative w-full aspect-[3/4] overflow-hidden bg-[#f5f5f5]'>
          <img
            alt={product.productName}
            src={'http://localhost:5000/images/' + product.imageUrl}
            className='absolute inset-0 w-full h-full object-cover'
          />
        </div>

        <div className='flex flex-col text-left p-2 flex-1'>
          <Text
            className='text-gray-800 font-normal text-[13px] leading-tight line-clamp-2 mb-1.5 min-h-[36px]'
            title={product.productName}
          >
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
    <div className='bg-[#f5f5f5] w-full pb-16'>
      <div className='max-w-[1200px] mx-auto px-4 py-8'>
        {/* 1. THANH ĐIỀU HƯỚNG MỚI */}
        <div className='flex items-center bg-white p-3 md:p-4 mb-6 shadow-sm rounded-sm text-sm border-b border-gray-100'>
          <span className='text-gray-600 font-medium mr-4 hidden md:block'>Hiển thị:</span>
          <div className='flex gap-3 w-full md:w-auto overflow-x-auto'>
            <Button
              type={activeTab === 'all' ? 'primary' : 'default'}
              className={`rounded-sm px-6 h-9 font-medium border-none ${
                activeTab === 'all'
                  ? 'bg-[#ee4d2d] text-white hover:!bg-[#ee4d2d]/90'
                  : 'bg-gray-100 text-gray-700 hover:text-[#ee4d2d]'
              }`}
              onClick={() => handleTabChange('all')}
            >
              Tất cả sản phẩm
            </Button>

            {/* Nút Danh mục kèm Dropdown */}
            <Dropdown menu={{ items: categoryMenuItems, onClick: handleCategorySelect }} placement='bottomLeft'>
              <Button
                type={activeTab === 'category' ? 'primary' : 'default'}
                className={`rounded-sm px-6 h-9 font-medium border-none ${
                  activeTab === 'category'
                    ? 'bg-[#ee4d2d] text-white hover:!bg-[#ee4d2d]/90'
                    : 'bg-gray-100 text-gray-700 hover:text-[#ee4d2d]'
                }`}
              >
                {activeTab === 'category' && selectedCategory !== 'all' ? (
                  <span className='flex items-center gap-2'>
                    {categories.find((c) => c.id.toString() === selectedCategory)?.name || 'Danh mục'}
                    <span
                      className='text-xs hover:text-gray-200 cursor-pointer ml-1'
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleTabChange('all');
                      }}
                      title='Xóa danh mục'
                    >
                      ✕
                    </span>
                  </span>
                ) : (
                  'Danh mục ▼'
                )}
              </Button>
            </Dropdown>
            <Button
              type={activeTab === 'recommended' ? 'primary' : 'default'}
              className={`rounded-sm px-6 h-9 font-medium border-none ${
                activeTab === 'recommended'
                  ? 'bg-[#ee4d2d] text-white hover:!bg-[#ee4d2d]/90'
                  : 'bg-gray-100 text-gray-700 hover:text-[#ee4d2d]'
              }`}
              onClick={() => handleTabChange('recommended')}
            >
              Đề xuất
            </Button>
          </div>
        </div>

        {/* 2. DANH SÁCH SẢN PHẨM (1 hàng 5 sản phẩm) */}
        <div className='grid  grid-cols-5 gap-3'>
          {products.map((p, i) => {
            const isLast = i === products.length - 1;
            return renderProductCard(p, i, isLast);
          })}

          {/* Skeleton hiển thị lúc Loading (Cũng chia 5 cột) */}
          {loading &&
            Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={`skel-${idx}`}
                className='flex flex-col bg-white border border-transparent shadow-sm rounded-sm pb-3'
              >
                <div className='w-full aspect-[3/4] overflow-hidden mb-2'>
                  <Skeleton.Image active className='!w-full !h-full !rounded-none' />
                </div>
                <div className='px-2'>
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
              </div>
            ))}
        </div>

        {/* Loading / End of List Indicator */}
        <div className='flex justify-center mt-10 pb-8'>
          {loading && products.length > 0 && <Spin size='large' />}
          {!hasMore && products.length > 0 && (
            <Text className='text-gray-400 tracking-wider uppercase text-xs font-semibold'>Đã tải hết sản phẩm</Text>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;
