import React, { useEffect, useState } from 'react';
import { Layout, Flex, Button, Menu } from 'antd';
import { PlusOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import hmLogo from '@/assets/images/H&M-Logo.svg.png';
import http from '@/apis/http';
import { ItemType, MenuItemType } from 'antd/es/menu/interface';

const { Sider } = Layout;

interface AppSiderProps {
  collapsed: boolean;
}

interface Category {
  id: number;
  name: string;
  parentId?: number | null; // Thêm trường này nếu API trả về danh sách phẳng
  subCategories?: Category[];
}

const AppSider: React.FC<AppSiderProps> = ({ collapsed }) => {
  const [menuItems, setMenuItems] = useState<MenuProps['items']>([
    { key: 'home', icon: <HomeOutlined />, label: 'Trang chủ' }
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await http.get('/api/Category');
        let categories: Category[] = res.data;

        // TÙY CHỌN BẢO VỆ: Nếu API trả về TẤT CẢ danh mục (cả cha lẫn con) chung 1 mảng,
        // bạn cần filter để chỉ lấy những category không có parentId (là category cha)
        // Nếu API của bạn đã nhóm sẵn và chỉ trả về danh mục cha ở level 1 thì có thể bỏ qua dòng filter này.
        categories = categories.filter((cat) => cat.parentId === null || cat.parentId === undefined);

        // Gộp các category cha vào mục "Sản phẩm"
        const dynamicChildren = categories.map((cat) => ({
          key: `cat_${cat.id}`,
          label: cat.name
        }));

        setMenuItems([
          { key: 'home', icon: <HomeOutlined />, label: 'Trang chủ' },
          {
            key: 'products',
            icon: <AppstoreOutlined />,
            label: 'Sản phẩm',
            children: dynamicChildren as ItemType<MenuItemType>[]
          },
          { key: 'recommendations', label: 'Đề xuất' }
        ]);
      } catch (error) {
        console.error('Lỗi khi tải danh mục', error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme='light'
      width={240}
      className='border-r border-gray-200 h-screen overflow-y-auto bg-white'
      style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
    >
      <Flex gap={12} justify='center' align='center' className='h-[64px] px-5 mt-2 mb-2'>
        <img
          src={hmLogo}
          alt='H&M Logo'
          className={`object-contain transition-all duration-300 ${collapsed ? 'w-10' : 'w-16'}`}
        />
      </Flex>
      <div className='px-3 mt-4 '>
        <div className={`flex ${collapsed ? 'justify-center' : ''}`}>
          <Button
            type='primary'
            shape={collapsed ? 'circle' : 'round'}
            icon={<PlusOutlined />}
            className={`${collapsed ? 'w-11' : 'w-full'} mb-6 h-11 flex items-center justify-center font-semibold bg-black hover:!bg-gray-800 border-none shadow-md text-[15px] transition-all duration-200`}
          >
            {!collapsed && 'Mua sắm ngay'}
          </Button>
        </div>
        <Menu
          mode='inline'
          defaultSelectedKeys={['home']}
          items={menuItems}
          className='border-none bg-transparent kaggle-menu'
          style={{ fontSize: '14px', fontWeight: 500 }}
        />
      </div>
    </Sider>
  );
};

export default AppSider;
