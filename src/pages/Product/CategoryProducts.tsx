import React, { useState, useEffect } from 'react';
import { Typography, Spin, message, Button, Input, Select, Space, Modal, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { Link, useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { HeartOutlined, HeartFilled, RightOutlined, DownOutlined, SearchOutlined, PictureOutlined, AudioOutlined, CameraOutlined, DeleteOutlined, InboxOutlined, CloseOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { getFavorites, toggleFavorite } from '@/utils/favorite';
import { getImageUrl } from '@/utils/imageUrl';
import { handleQuickBuy } from '@/utils/quickBuy';
import { getAIHistory } from '@/utils/aiHistory';

const { Text } = Typography;

interface Product {
  productId: string;
  productName: string;
  imageUrl: string;
  price: number;
  currentPrice?: number;
  originalPrice?: number;
  discountPercentage?: number;
  soldQuantity?: number;
  SoldQuantity?: number;
  productVariants?: any[];
}

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  subCategories?: Category[];
}

interface CategoryProductsProps {
  mode?: 'category' | 'search' | 'flash-sale' | 'recommended';
}

const CategoryProducts: React.FC<CategoryProductsProps> = ({ mode = 'category' }) => {
  const { id } = useParams<{ id: string }>(); // Parent category ID
  const [searchParams, setSearchParams] = useSearchParams();
  const subId = searchParams.get('sub'); // Selected subcategory ID
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  
  const [keyword, setKeyword] = useState('');
  
  const currentType = searchParams.get('type') || 'new';
  const currentPrice = searchParams.get('price');
  
  // States for Local Search (Text, Voice, Image)
  const [localSearchKeyword, setLocalSearchKeyword] = useState('');
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Sync state from URL parameters
  useEffect(() => {
    const type = searchParams.get('type');
    const price = searchParams.get('price');

    // Default to type=new if nothing is specified
    if (!type && !price) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('type', 'new');
      setSearchParams(newParams, { replace: true, state: location.state });
      return;
    }
  }, [searchParams, setSearchParams]);

  const handleFilterChange = (filterType: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', filterType);
    setSearchParams(newParams, { state: location.state });
  };

  const handlePriceChange = (val: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (!val) {
      newParams.delete('price');
    } else if (val === 'price_desc') {
      newParams.set('price', 'des');
    } else if (val === 'price_asc') {
      newParams.set('price', 'ins');
    }
    setSearchParams(newParams, { state: location.state });
  };
  const [transcript, setTranscript] = useState('');
  
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeSearchImage, setActiveSearchImage] = useState<string | null>(null);
  const [localImageProducts, setLocalImageProducts] = useState<any[]>([]);
  const [hasFilteredImageSearch, setHasFilteredImageSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const location = useLocation();
  const isImageSearch = mode === 'search' && searchParams.get('image') === 'true';
  const queryParam = searchParams.get('q');

  console.log(products);
  
  
  // Initialize keyword if in search mode and clear local overrides on route change
  useEffect(() => {
    // Only initialize from location.state if we just navigated here via an image search link
    if (mode === 'search' && isImageSearch && location.state?.activeSearchImage) {
      setHasFilteredImageSearch(true);
      setActiveSearchImage(location.state.activeSearchImage);
      if (location.state?.products) {
        setLocalImageProducts(location.state.products);
      }
    } else if (mode === 'search' && !isImageSearch) {
      // Clear image search state if we are doing a text search
      setHasFilteredImageSearch(false);
      setActiveSearchImage(null);
      setLocalImageProducts([]);
    }
    
    if (mode === 'search' && queryParam) {
      setKeyword(queryParam);
      setLocalSearchKeyword(queryParam);
    } else if (mode === 'search' && isImageSearch) {
      setKeyword('');
      setLocalSearchKeyword('');
    } else if (!hasFilteredImageSearch && !isImageSearch) {
      setKeyword('');
      setLocalSearchKeyword('');
    }
  }, [mode, queryParam, location.pathname, isImageSearch, location.state]);

  // Handle clearing local image search when navigating to a completely different category
  useEffect(() => {
    if (mode === 'category') {
      setHasFilteredImageSearch(false);
      setActiveSearchImage(null);
      setLocalImageProducts([]);
    }
  }, [location.pathname]);

  const [favorites, setFavorites] = useState<string[]>(getFavorites());

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await http.get('/api/Category');
        // const res = await getCategories();
        const cats: Category[] = res.data;
        if (mode === 'category' && id) {
          const currentParent = cats.find(c => c.id.toString() === id);
          if (currentParent) {
            setParentCategory(currentParent);
            setSubCategories(currentParent.subCategories || []);
          }
        } else {
          // For search and flash-sale, display all root categories
          setParentCategory({ id: 0, name: 'All category' } as Category);
          setSubCategories(cats);
        }
      } catch (error) {
        message.error('Lỗi khi tải danh mục');
      }
    };
    fetchCats();
  }, [id, mode]);

  // Auto-expand parent category when a leaf category is selected via URL
  useEffect(() => {
    if (subId && subCategories.length > 0) {
      // Find if the subId belongs to any subCategory's children (leaf)
      const parentCat = subCategories.find(sub => 
        sub.subCategories?.some(leaf => leaf.id.toString() === subId)
      );
      
      if (parentCat) {
        setExpandedCats([parentCat.id.toString()]); // Expand only the parent, close others
      } else {
        // If the subId is a level-2 category itself, maybe expand it
        const isLevel2 = subCategories.some(sub => sub.id.toString() === subId);
        if (isLevel2) {
          setExpandedCats([subId]);
        }
      }
    } else if (!subId) {
      // If "View All" is selected (no subId), maybe close all or leave as is. 
      // The user requested: "Còn nếu chọn danh mục con thì... đóng các category khác lại".
      // We can leave this alone so they stay expanded when clicking View All, or clear it.
      // Let's clear it so it looks clean when returning to View All.
      setExpandedCats([]);
    }
  }, [subId, subCategories]);

  // Fetch Products
  const fetchProds = async (pageNum: number, isNew = false) => {
    try {
      if (isNew) setLoading(true);
      else setLoadingMore(true);

      if (isImageSearch || hasFilteredImageSearch) {
        const imageProducts = isImageSearch ? (location.state?.products || localImageProducts || []) : localImageProducts;
        let sorted = [...imageProducts];
        
        // Filter by favorites
        if (currentType === 'favor') {
          const favIds = getFavorites();
          sorted = sorted.filter(p => favIds.includes(p.productId || (p as any).articleId || p.productCode));
        }

        // Sort by price
        if (currentPrice === 'ins') {
          sorted.sort((a,b) => (a.currentPrice || a.price || 0) - (b.currentPrice || b.price || 0));
        } else if (currentPrice === 'des') {
          sorted.sort((a,b) => (b.currentPrice || b.price || 0) - (a.currentPrice || a.price || 0));
        } 
        // Sort by bestselling
        else if (currentType === 'bestselling') {
          sorted.sort((a,b) => (b.soldQuantity || b.SoldQuantity || 0) - (a.soldQuantity || a.SoldQuantity || 0));
        }

        setProducts(sorted);
        setTotalItems(sorted.length);
      } else {
        const categoryIdToFetch = subId || (mode === 'category' ? id : undefined);
        
        if (currentType === 'favor') {
          // Sử dụng LocalStorage favorites thay vì query BE dựa trên token
          const favIds = getFavorites();
          if (favIds.length === 0) {
            setProducts([]);
            setTotalItems(0);
          } else {
            let backendSort = undefined;
            if (currentPrice === 'ins') backendSort = 'asc';
            else if (currentPrice === 'des') backendSort = 'desc';

            const res = await http.post('/api/Product/by-ids', {
              articleIds: favIds,
              sortPrice: backendSort
            });
            
            let fetchedData = res.data.data || [];
            const activeKw = mode === 'search' ? (keyword || queryParam) : keyword;
            
            // Lọc theo keyword nếu có
            if (activeKw) {
              const lowerKw = activeKw.toLowerCase();
              fetchedData = fetchedData.filter((p: any) => 
                p.productName?.toLowerCase().includes(lowerKw) || 
                p.description?.toLowerCase().includes(lowerKw)
              );
            }
            
            if (isNew) {
              setProducts(fetchedData);
            } else {
              setProducts(prev => [...prev, ...fetchedData]);
            }
            setTotalItems(fetchedData.length);
          }
        } else if (mode === 'recommended') {
          // Fetch recommended products
          const res = await http.get('/api/Product/ai-recommendations');
          
          let fetchedData = res.data || []; // Note: The response for GET /ai-recommendations is directly an array of products, not res.data.data
          const activeKw = keyword || queryParam;
          
          // Apply local filter/sort
          if (activeKw) {
            const lowerKw = activeKw.toLowerCase();
            fetchedData = fetchedData.filter((p: any) => 
              p.productName?.toLowerCase().includes(lowerKw) || 
              p.description?.toLowerCase().includes(lowerKw)
            );
          }
          
          if (currentPrice === 'ins') {
            fetchedData.sort((a: any,b: any) => (a.currentPrice || a.price || 0) - (b.currentPrice || b.price || 0));
          } else if (currentPrice === 'des') {
            fetchedData.sort((a: any,b: any) => (b.currentPrice || b.price || 0) - (a.currentPrice || a.price || 0));
          } else if (currentType === 'bestselling') {
            fetchedData.sort((a: any,b: any) => (b.soldQuantity || b.SoldQuantity || 0) - (a.soldQuantity || a.SoldQuantity || 0));
          }

          if (isNew) {
            setProducts(fetchedData);
          } else {
            // Note: Currently recommendation endpoint doesn't support pagination, so we load all at once.
            setProducts(prev => [...prev, ...fetchedData]);
          }
          setTotalItems(fetchedData.length);
        } else {
          let backendSortBy = '';
          if (currentType === 'bestselling') backendSortBy = 'best_selling';
          
          const res = await http.get('/api/Product', { 
            params: {
              categoryId: categoryIdToFetch, 
              keyword: mode === 'search' ? (keyword || queryParam || undefined) : keyword, 
              sortBy: backendSortBy,
              sortPrice: currentPrice || undefined,
              page: pageNum, 
              pageSize,
              isFlashSale: mode === 'flash-sale'
            }
          });
          
          if (isNew) {
            setProducts(res.data.items || []);
          } else {
            setProducts(prev => [...prev, ...(res.data.items || [])]);
          }
          setTotalItems(res.data.totalItems || 0);
        }
      }
    } catch (error) {
      message.error('Lỗi khi tải sản phẩm');
    } finally {
      if (isNew) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProds(1, true);
  }, [id, subId, keyword, currentType, currentPrice, mode, queryParam, isImageSearch, hasFilteredImageSearch, localImageProducts, location.state]);

  useEffect(() => {
    if (page > 1) {
      fetchProds(page, false);
    }
  }, [page]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    setIsScrolled(scrollTop > 10);

    if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && !loadingMore && products.length < totalItems) {
      setPage(prev => prev + 1);
    }
  };

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleToggleFav = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Kiểm tra đăng nhập
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    toggleFavorite(productId);
    setFavorites(getFavorites());
  };

  const handleSubCategoryClick = (subCategoryId?: number) => {
    setPage(1);
    if (subCategoryId) {
      setSearchParams({ sub: subCategoryId.toString() });
    } else {
      setSearchParams({});
    }
  };

  // ====================================================================
  // LOGIC: VOICE SEARCH WITHIN CATEGORY
  // ====================================================================
  const startVoiceSearch = () => {
    const SpeechRecognitionAPI = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      message.error('Trình duyệt của bạn không hỗ trợ tìm kiếm giọng nói.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = false;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      finalTranscript = ''; 
      setIsMicModalOpen(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      finalTranscript = text;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        setTimeout(() => {
          setIsMicModalOpen(false);
          setKeyword(finalTranscript.trim());
          setLocalSearchKeyword(finalTranscript.trim());
          setHasFilteredImageSearch(false);
          setActiveSearchImage(null);
          setLocalImageProducts([]);
          setPage(1);
          setSearchParams({});
        }, 1000);
      } else {
        setTimeout(() => setIsMicModalOpen(false), 2000);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setIsMicModalOpen(false);
      message.error('Có lỗi xảy ra khi nhận diện giọng nói.');
    };

    recognition.start();
  };

  // ====================================================================
  // LOGIC: IMAGE SEARCH WITHIN CATEGORY
  // ====================================================================
  const getBase64 = (file: File | Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleRemoveImage = () => {
    setFileList([]);
    setPreviewImage(null);
  };

  const handleExecuteImageSearch = async () => {
    if (fileList.length === 0) {
      message.error('Vui lòng tải ảnh lên trước!');
      return;
    }

    try {
      setLoadingSearch(true);
      message.loading({ content: 'AI đang phân tích hình ảnh...', key: 'ai-cat-search' });

      const formData = new FormData();
      const fileToUpload = fileList[0]?.originFileObj || fileList[0];
      formData.append('image', fileToUpload as Blob);
      
      const res = await http.post('/api/Product/search-by-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      let aiProducts = res.data.data;

      const base64 = await getBase64(fileToUpload as File);
      setActiveSearchImage(base64);

      message.success({ content: 'Phân tích thành công!', key: 'ai-cat-search', duration: 2 });
      setIsCameraModalOpen(false);
      handleRemoveImage();
      
      setLocalImageProducts(aiProducts);
      setHasFilteredImageSearch(true);
      setPage(1);
      setKeyword('');
      setLocalSearchKeyword('');
      setSearchParams({});
    } catch  {
      message.error({ content: 'Lỗi khi phân tích ảnh!', key: 'ai-cat-search' });
    } finally {
      setLoadingSearch(false);
    }
  };


  const renderProductCard = (product: Product) => {
    const priceToDisplay = product.currentPrice || product.price || 0;
    const originalPriceToDisplay = product.originalPrice || 0;
    
    return (
      <Link
        to={`/product/${product.productId}`}
        className='group flex flex-col cursor-pointer border border-transparent hover:border-gray-300 hover:-translate-y-1 hover:shadow-md transition-all duration-300 bg-white relative rounded-md overflow-hidden'
      >
        <div className='relative w-full aspect-[3/4] overflow-hidden bg-[#f5f5f5]'>
          <img
            alt={product.productName}
            src={product.imageUrl?.startsWith('http') ? product.imageUrl : getImageUrl(product.imageUrl)}
            className='absolute inset-0 w-full h-full object-cover'
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image' }}
          />
          <div 
            className='absolute top-2 right-2 bg-white/80 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-white transition-all z-10'
            onClick={(e) => handleToggleFav(e, product.productId || (product as any).articleId)}
          >
            {favorites.includes(product.productId || (product as any).articleId) ? (
              <HeartFilled className='text-blue-500 text-lg' />
            ) : (
              <HeartOutlined className='text-gray-500 text-lg hover:text-blue-500' />
            )}
          </div>
        </div>

        <div className='flex flex-col text-left p-2 flex-1'>
          <Text
            className='text-gray-800 font-normal text-[13px] leading-tight line-clamp-2 mb-1.5 min-h-[36px]'
            title={product.productName}
          >
            {product.productName}
          </Text>
          <div className='flex flex-col mt-auto pt-2'>
            <div className='h-[18px] flex items-center justify-between w-full'>
              {originalPriceToDisplay > priceToDisplay ? (
                <div className='flex items-center gap-1.5'>
                  <span className='text-gray-400 text-[11px] line-through'>
                    {new Intl.NumberFormat('vi-VN').format(originalPriceToDisplay)}<span className='underline text-[9px]'>đ</span>
                  </span>
                  <div className='flex items-center bg-[#ffebb3] text-[#ee4d2d] text-[10px] font-bold px-1 rounded-sm'>
                    <span className='mr-0.5'>⚡</span>
                    <span>-{product.discountPercentage || Math.round((1 - priceToDisplay/originalPriceToDisplay)*100)}%</span>
                  </div>
                </div>
              ) : <div></div>}
              <span className='text-gray-500 text-[10px] ml-2'>Sold {product.soldQuantity || product.SoldQuantity || 0}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-[#ee4d2d] font-bold text-[15px] leading-none'>
                {new Intl.NumberFormat('vi-VN').format(priceToDisplay)}<span className='underline text-[10px] ml-0.5'>đ</span>
              </span>
              <div 
                className='bg-[#ee4d2d] text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap hover:bg-[#d73f22] transition-colors cursor-pointer'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuickBuy((product as any).productId || (product as any).id || (product as any).articleId, navigate);
                }}
              >
                Buy Now
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className='bg-[#f5f5f5] w-full min-h-screen py-8'>
      <div className='w-full px-4 lg:px-8 xl:px-12 flex gap-6'>
        {/* Sidebar */}
        {mode !== 'search' && (
        <div className='w-64 shrink-0 bg-white p-4 shadow-sm rounded-sm self-start h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar relative'>
          <h2 className='text-lg font-bold mb-4 border-b pb-2 sticky top-0 bg-white z-10'>{parentCategory?.name || 'Danh mục'}</h2>
          <ul className='space-y-2'>
            <li>
              <button
                onClick={() => handleSubCategoryClick()}
                className={`w-full text-left px-2 py-1.5 rounded-sm transition-colors ${!subId ? 'bg-[#ee4d2d] text-white font-medium' : 'hover:text-[#ee4d2d] text-gray-700'}`}
              >
                View All
              </button>
            </li>
            {subCategories.map(sub => {
              const hasSub = sub.subCategories && sub.subCategories.length > 0;
              const isExpanded = expandedCats.includes(sub.id.toString());
              
              return (
                <li key={sub.id} className="mb-2">
                  <div className={`flex justify-between items-center px-2 py-1.5 rounded-sm transition-colors ${subId === sub.id.toString() ? 'bg-[#ee4d2d] text-white' : 'hover:bg-gray-50'}`}>
                    <button
                      onClick={() => handleSubCategoryClick(sub.id)}
                      className={`flex-1 text-left font-medium ${subId === sub.id.toString() ? 'text-white' : 'text-gray-800 hover:text-[#ee4d2d]'}`}
                    >
                      {sub.name}
                    </button>
                    {hasSub && (
                       <button onClick={(e) => toggleExpand(sub.id.toString(), e)} className={`p-1 flex items-center justify-center ${subId === sub.id.toString() ? 'text-white' : 'text-gray-500 hover:text-[#ee4d2d]'}`}>
                          {isExpanded ? <DownOutlined className="text-[10px]" /> : <RightOutlined className="text-[10px]" />}
                       </button>
                    )}
                  </div>
                  {hasSub && isExpanded && (
                    <ul className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-2">
                      {sub.subCategories!.map(leaf => (
                        <li key={leaf.id}>
                           <button
                             onClick={() => handleSubCategoryClick(leaf.id)}
                             className={`w-full text-left px-2 py-1 text-[13px] rounded-sm transition-colors ${subId === leaf.id.toString() ? 'text-[#ee4d2d] font-bold' : 'text-gray-500 hover:text-[#ee4d2d]'}`}
                           >
                             {leaf.name}
                           </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        )}

        {/* Main Content */}
        <div className='flex-1 bg-white p-4 shadow-sm rounded-sm h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar flex flex-col relative' onScroll={handleScroll}>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
          `}</style>
          
          {mode !== 'category' && (
            <div className='bg-white p-4 mb-4 shadow-sm rounded-sm flex items-center justify-between border border-gray-100'>
              <div className='flex items-center gap-2 text-lg font-medium text-gray-800'>
                {mode === 'search' ? (
                  <>
                    <SearchOutlined className='text-[#ee4d2d] mr-2' />
                    <div className="flex items-center gap-3">
                      <span>Search Results:</span>
                      
                      {((hasFilteredImageSearch && activeSearchImage) || (isImageSearch && activeSearchImage)) && (
                        <div className="flex items-center gap-2 bg-[#fff5f4] px-2 py-1 border border-[#ee4d2d]/30 rounded-sm">
                          <span className="text-[12px] text-gray-600">Image:</span>
                          <img src={activeSearchImage} alt="search" className="w-8 h-8 object-cover rounded border border-gray-200" />
                          <CloseOutlined 
                            className="text-gray-400 hover:text-red-500 cursor-pointer ml-1 text-[11px]" 
                            onClick={() => {
                              setHasFilteredImageSearch(false);
                              setActiveSearchImage(null);
                              setLocalImageProducts([]);
                              if (isImageSearch) navigate('/search');
                            }} 
                          />
                        </div>
                      )}

                      {keyword && (
                        <div className="flex items-center gap-1.5 bg-[#fff5f4] px-2 py-1 border border-[#ee4d2d]/30 rounded-sm">
                          <span className="text-[12px] text-gray-600">Keyword:</span>
                          <span className="text-[13px] font-medium text-[#ee4d2d]">"{keyword}"</span>
                          <CloseOutlined 
                            className="text-gray-400 hover:text-red-500 cursor-pointer ml-1 text-[11px]" 
                            onClick={() => {
                              setKeyword('');
                              setLocalSearchKeyword('');
                              navigate('/search');
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : mode === 'flash-sale' ? (
                  <>
                    <span className="text-[#ee4d2d] text-2xl font-bold italic mr-2">⚡ FLASH SALE</span>
                  </>
                ) : mode === 'recommended' ? (
                  <>
                    <span className="text-[#ee4d2d] text-2xl font-bold mr-2">✨ RECOMMENDATIONS FOR YOU</span>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <div className={`flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 p-3 rounded-sm sticky top-0 z-10 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md border-b border-gray-200' : 'bg-gray-50 border border-gray-100 shadow-sm'}`}>
             <div className="flex gap-2 items-center w-full">
                <span className="text-gray-500 text-sm mr-2 whitespace-nowrap">Sort by:</span>
                <Button type={currentType === 'new' ? 'primary' : 'default'} onClick={() => handleFilterChange('new')} className={currentType === 'new' ? 'bg-[#ee4d2d] border-[#ee4d2d]' : ''}>Newest</Button>
                <Button type={currentType === 'bestselling' ? 'primary' : 'default'} onClick={() => handleFilterChange('bestselling')} className={currentType === 'bestselling' ? 'bg-[#ee4d2d] border-[#ee4d2d]' : ''}>Best Selling</Button>
                <Button type={currentType === 'favor' ? 'primary' : 'default'} onClick={() => handleFilterChange('favor')} className={currentType === 'favor' ? 'bg-blue-500 border-blue-500 text-white hover:!bg-blue-600' : ''} icon={<HeartFilled />}>Favorite</Button>
                <Select 
                   value={currentPrice === 'des' ? 'price_desc' : currentPrice === 'ins' ? 'price_asc' : undefined} 
                   onChange={(val) => handlePriceChange(val)} 
                   allowClear
                   placeholder="Price"
                   style={{ width: 180 }} 
                   options={[
                     {label: 'Price: Low to High', value: 'price_asc'}, 
                     {label: 'Price: High to Low', value: 'price_desc'}
                   ]} 
                   className={currentPrice ? 'border-[#ee4d2d] rounded-md' : ''}
                />
                 <div className="w-full flex items-center">
                <Input
                  value={localSearchKeyword}
                  onChange={(e) => setLocalSearchKeyword(e.target.value)}
                  onPressEnter={() => { 
                    setKeyword(localSearchKeyword); 
                    setHasFilteredImageSearch(false);
                    setActiveSearchImage(null);
                    setLocalImageProducts([]);
                    setPage(1); 
                  }}
                  placeholder={`Search products in this category`}
                  className='rounded-full flex-1 bg-white border-gray-300 hover:border-[#ee4d2d] focus:border-[#ee4d2d]'
                  prefix={<SearchOutlined className='text-gray-400' />}
                  suffix={
                    <Space size={2}>
                      <Button type="text" shape="circle" size="small" icon={<AudioOutlined className='text-gray-500 hover:text-[#ee4d2d]' />} onClick={startVoiceSearch} />
                      <Button type="text" shape="circle" size="small" icon={<CameraOutlined className='text-gray-500 hover:text-[#ee4d2d]' />} onClick={() => setIsCameraModalOpen(true)} />
                    </Space>
                  }
                />
             </div>
             </div>
             
            
          </div>

       {mode !== 'search' && (   (hasFilteredImageSearch && activeSearchImage) || keyword ? (
            <div className="flex items-center gap-3 mb-4 px-3 py-2 bg-white border border-[#ee4d2d]/30 rounded-sm shadow-sm">
              <span className="text-gray-600 text-[13px]">Search results for:</span>
              
              {hasFilteredImageSearch && activeSearchImage && (
                <div className="flex items-center gap-2 bg-[#fff5f4] px-2 py-1 border border-[#ee4d2d]/30 rounded-sm">
                  <span className="text-[12px] text-gray-600">Image:</span>
                  <img src={activeSearchImage} alt="search" className="w-6 h-6 object-cover rounded border border-gray-200" />
                  <CloseOutlined 
                    className="text-gray-400 hover:text-red-500 cursor-pointer ml-1 text-[11px]" 
                    onClick={() => {
                      setHasFilteredImageSearch(false);
                      setActiveSearchImage(null);
                      setLocalImageProducts([]);
                    }} 
                  />
                </div>
              )}

              {keyword && (
                <div className="flex items-center gap-1.5 bg-[#fff5f4] px-2 py-1 border border-[#ee4d2d]/30 rounded-sm">
                  <span className="text-[12px] text-gray-600">Keyword:</span>
                  <span className="text-[13px] font-medium text-[#ee4d2d]">"{keyword}"</span>
                  <CloseOutlined 
                    className="text-gray-400 hover:text-red-500 cursor-pointer ml-1 text-[11px]" 
                    onClick={() => {
                      setKeyword('');
                      setLocalSearchKeyword('');
                    }} 
                  />
                </div>
              )}
            </div>
          ) : null) }

          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <Spin size='large' />
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className='text-center text-gray-500 py-10'>No products found in this category.</div>
              ) : (
                <div className='grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
                  {products.map(renderProductCard)}
                </div>
              )}

              {loadingMore && (
                <div className='flex justify-center mt-6 mb-4'>
                  <Spin size='default' />
                </div>
              )}

              {!loadingMore && products.length > 0 && products.length >= totalItems && (
                <div className='text-center text-gray-500 py-6 mt-8 border-t border-gray-200/60 w-full col-span-full'>
                  <span className='bg-gray-100 px-4 py-1.5 rounded-full text-sm shadow-sm'>
                    All products displayed
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- CÁC MODAL TÌM KIẾM --- */}
      {/* Voice Modal */}
      <Modal open={isMicModalOpen} onCancel={() => setIsMicModalOpen(false)} footer={null} closable={true} destroyOnClose centered width={300} bodyStyle={{ padding: '32px 24px', textAlign: 'center' }}>
        <div className='flex flex-col items-center justify-center'>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${isListening ? 'bg-red-100 scale-110 shadow-lg' : 'bg-gray-100'}`}>
            <AudioOutlined className={`text-4xl ${isListening ? 'text-[#ee4d2d]' : 'text-gray-400'}`} />
          </div>
          <Typography.Title level={4} className='mb-2'>{isListening ? 'Listening...' : 'Ready'}</Typography.Title>
          <Text className='text-gray-500 mb-6 min-h-[44px] block'>
            {transcript || (isListening ? 'Please speak the name of the product you want to find' : 'Processing...')}
          </Text>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal open={isCameraModalOpen} onCancel={() => { setIsCameraModalOpen(false); handleRemoveImage(); }} title={<span className="text-lg">Search by Image</span>} footer={null} destroyOnClose centered width={450}>
        <div className='pt-2'>
          <Upload.Dragger
            name='image'
            multiple={false}
            showUploadList={false}
            beforeUpload={async (file) => {
              const base64 = await getBase64(file);
              setPreviewImage(base64);
              setFileList([file]);
              return false; // Prevent auto upload
            }}
            className='bg-gray-50'
          >
            {previewImage ? (
              <div className='relative w-full h-[250px] p-2'>
                <img src={previewImage} alt='preview' className='w-full h-full object-contain rounded-md' />
                <div className='absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-md'>
                  <Text className='text-white font-medium'>Click or drag and drop another image to change</Text>
                </div>
              </div>
            ) : (
              <div className='py-8 flex flex-col items-center justify-center'>
                <p className='ant-upload-drag-icon mb-4'><InboxOutlined className='text-4xl text-[#ee4d2d]' /></p>
                <p className='ant-upload-text font-medium text-gray-700 mb-2'>Click or drag and drop an image into this area</p>
                <p className='ant-upload-hint text-gray-500 text-xs px-8'>Supports JPG, PNG, JPEG formats. Maximum size 5MB.</p>
              </div>
            )}
          </Upload.Dragger>

          {fileList.length > 0 && (
            <div className='mt-5 flex justify-end gap-3 border-t pt-4'>
              <Button size='large' icon={<DeleteOutlined />} onClick={handleRemoveImage} disabled={loadingSearch}>Delete Image</Button>
              <Button type='primary' size='large' icon={<SearchOutlined />} className='bg-[#ee4d2d]' onClick={handleExecuteImageSearch} loading={loadingSearch}>Search Now</Button>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};

export default CategoryProducts;
