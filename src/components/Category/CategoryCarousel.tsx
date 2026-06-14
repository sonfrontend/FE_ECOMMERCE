import React, { useEffect, useState } from 'react';
import { Typography, Spin } from 'antd';
import http from '@/apis/http';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/utils/imageUrl';

const { Title, Text } = Typography;

const CategoryCarousel: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await http.get('/api/Category');
        // Chỉ lấy danh mục cha cấp 1 (parentId null)
        if (res.data) {
          const parentCats = res.data.filter((c: any) => 
            !c.parentId && 
            !c.ParentId
          );
          setCategories(parentCats);
        }
      } catch (error) {
        console.error('Lỗi lấy danh mục', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return <div className="py-10 text-center"><Spin /></div>;
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white mt-5">
      <div className="border-b border-gray-100 py-4 px-5 uppercase text-gray-500 font-semibold tracking-wider text-sm">
        DANH MỤC
      </div>
      <div className="w-full p-4">
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
        
        {/* Container chia đều width cho các danh mục trên cùng 1 hàng */}
        <div className="flex flex-nowrap w-full gap-2 md:gap-4 justify-between">
          {categories.map((cat) => (
            <div 
              key={cat.id || cat.Id || cat.categoryId}
              className="flex-1 min-w-0 flex flex-col items-center justify-start text-center"
            >
              <div 
                className="cursor-pointer group flex flex-col items-center p-2 rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-md hover:-translate-y-1 bg-white"
                onClick={() => navigate(`/category/${cat.id || cat.Id || cat.categoryId}`)}
              >
                <div className="w-28 h-16 md:w-40 md:h-24 bg-gray-50 rounded-xl flex items-center justify-center mb-3 shadow-sm border border-gray-100 overflow-hidden transition-transform group-hover:scale-105">
                  {cat.iconUrl || cat.IconUrl ? (
                    <img 
                      src={getImageUrl(`${cat.iconUrl}`)} 
                      alt={cat.name || cat.Name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400 font-bold text-2xl">
                      {(cat.name || cat.Name || 'C')[0]}
                    </div>
                  )}
                </div>
                <Text className="text-sm md:text-base font-medium text-gray-700 line-clamp-2 leading-tight group-hover:text-[#ee4d2d] transition-colors">
                  {cat.name || cat.Name || cat.categoryName}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;
