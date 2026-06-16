import React, { useState, useEffect } from 'react';
import { Typography, Button, Skeleton, message, Spin, Dropdown, Select } from 'antd';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';

import http from '@/apis/http';
import { getAIHistory } from '@/utils/aiHistory';
import { getFavorites, toggleFavorite } from '@/utils/favorite';
import { getImageUrl } from '@/utils/imageUrl';
import ProductCard from './ProductCard';

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
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // State quản lý Tab đang chọn trên thanh điều hướng
  const [activeTab, setActiveTab] = useState<'all' | 'recommended' | 'category' | "favorite">(
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
  }, [searchParams, activeTab, selectedCategory]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<string | undefined>('newest');
  
  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(getFavorites());

  // Refs for Infinite Scroll
  useEffect(() => {
    setPage(1);
    setProducts([]);
  }, [sortOrder]);

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

  // Lấy sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        if (activeTab === 'recommended') {
          const aiHistory = getAIHistory();
          // Nếu có lịch sử thì gọi API recommend
          const res = await http.post('/api/Product/recommendations', {
            articleIds: aiHistory,
            topK: 20
          });
          const { data } = res.data;
          
          setProducts(data);
          setHasMore(false); // Gợi ý thường hiển thị 1 trang
        } else if (activeTab === 'favorite') {
          const favIds = getFavorites();
          const res = await http.post('/api/Product/by-ids', {
            articleIds: favIds,
            sortPrice: sortOrder
          });
          const { data } = res.data;
          
          setProducts(data);
          setHasMore(false); // Yêu thích hiển thị 1 trang tạm thời
        } else {
          let url = `/api/Product?page=${page}&pageSize=20`;
          if (activeTab === 'category' && selectedCategory !== 'all') {
            // Gọi API danh mục cha
            url = `/api/Product/parent-category/${selectedCategory}?page=${page}&pageSize=20`;
          }
          
          if (sortOrder) {
            let backendSort = '';
            if (sortOrder === 'asc') backendSort = 'price_asc';
            else if (sortOrder === 'desc') backendSort = 'price_desc';
            else if (sortOrder === 'best_selling') backendSort = 'best_selling';
            
            if (backendSort) {
              url += `&sortBy=${backendSort}`;
            }
          }

          const res = await http.get(url);
          const { data, hasMore: more } = res.data;

          setProducts((prev) => (page === 1 ? data : [...prev, ...data]));
          setHasMore(more);
        }
      } catch (error) {
        message.error(String(error));
        // FIX: Ngừng gọi API liên tục khi có lỗi (chống infinite loop)
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, activeTab, selectedCategory, sortOrder]);

  const handleCategorySelect: MenuProps['onClick'] = (e) => {
    setActiveTab('category');
    setSelectedCategory(e.key);
    setPage(1);
    setProducts([]);
    setSearchParams({ tab: 'category', category: e.key });
  };

  const handleTabChange = (tab: 'all' | 'recommended' | 'favorite') => {
    setActiveTab(tab);
    setPage(1);
    setProducts([]);
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const handleToggleFav = (e: React.MouseEvent, articleId: string) => {
    e.preventDefault(); // Ngăn Link redirect
    e.stopPropagation();
    
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    toggleFavorite(articleId);
    setFavorites(getFavorites());
  };

  // Menu thả xuống cho nút Danh mục
  const categoryMenuItems: MenuProps['items'] = categories.map((cat) => ({
    key: cat.id.toString(),
    label: cat.name
  }));

  // Thẻ sản phẩm
  const renderProductCard = (product: Product, index: number, isLast: boolean) => {
    return (
      <div key={product.articleId + '-' + index} ref={isLast ? lastProductElementRef : null}>
        <ProductCard
          productId={product.articleId || (product as any).productId || product.productCode}
          name={product.productName}
          imageUrl={product.imageUrl}
          currentPrice={(product as any).currentPrice || product.price || 0}
          originalPrice={(product as any).originalPrice}
          discountPercentage={(product as any).discountPercentage}
          soldQuantity={(product as any).soldQuantity}
          rating={(product as any).rating}
          reviewsCount={(product as any).reviewsCount}
          likesCount={(product as any).likesCount}
          isFavorite={favorites.includes(product.articleId || (product as any).productId)}
          showFavoriteIcon={true}
          onFavoriteClick={(e) => handleToggleFav(e, product.articleId || (product as any).productId)}
        />
      </div>
    );
  };

  return (
    <div className='bg-[#f5f5f5] w-full pb-16'>
      <div className='max-w-[1200px] mx-auto px-4 py-8'>
        {/* 1. THANH ĐIỀU HƯỚNG MỚI */}
           <div className='flex flex-wrap items-center justify-between bg-white p-3 mb-4 shadow-sm rounded-sm text-sm border-b border-gray-100'>
          <div className='flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0'>
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
              
              {/* Tab Yêu thích */}
              <Button
                type={activeTab === 'favorite' ? 'primary' : 'default'}
                className={`rounded-sm px-6 h-9 font-medium border-none ${ activeTab === 'favorite'
                    ? 'bg-blue-500 text-white hover:!bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:text-blue-500'
                }`}
                onClick={() => handleTabChange('favorite')}
              >
                Yêu thích
              </Button>
               <div className="flex gap-2 items-center">
                 <Button 
                   type={sortOrder === 'newest' ? 'primary' : 'default'} 
                   onClick={() => {setSortOrder('newest'); setPage(1); setProducts([]);}} 
                   className={sortOrder === 'newest' ? 'bg-[#ee4d2d] border-[#ee4d2d]' : ''}
                 >
                   Mới nhất
                 </Button>
                 <Button 
                   type={sortOrder === 'best_selling' ? 'primary' : 'default'} 
                   onClick={() => {setSortOrder('best_selling'); setPage(1); setProducts([]);}} 
                   className={sortOrder === 'best_selling' ? 'bg-[#ee4d2d] border-[#ee4d2d]' : ''}
                 >
                   Bán chạy
                 </Button>
                 <span className='text-gray-600 mr-2 whitespace-nowrap ml-4'>Sắp xếp theo</span>
                 <Select
                   placeholder='Giá'
                   value={['asc', 'desc'].includes(sortOrder as string) ? sortOrder : undefined}
                   onChange={(val) => {setSortOrder(val); setPage(1); setProducts([]);}}
                   allowClear
                   className='w-40 h-8'
                   options={[
                     { value: 'asc', label: 'Giá: Thấp đến Cao' },
                     { value: 'desc', label: 'Giá: Cao đến Thấp' }
                   ]}
                 />
               </div>
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
