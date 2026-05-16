import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Dropdown, Avatar, Menu, Space, Modal, Upload, Typography, Drawer, Badge } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  AudioOutlined,
  CameraOutlined,
  MenuOutlined,
  InboxOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import hmLogo from '@/assets/images/H&M-Logo.svg.png';
import http from '@/apis/http';
import { ItemType, MenuItemType } from 'antd/es/menu/interface';

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  subCategories?: Category[];
}

const { Dragger } = Upload;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  const handleVoiceSearch = () => {
    // Giả lập nhận diện giọng nói
    setTimeout(() => {
      setIsMicModalOpen(false);
      navigate('/search?q=áo%20thun'); // giả lập từ khóa "áo thun"
    }, 2000);
  };

  // const handleImageSearch = () => {
  //   // Giả lập tìm kiếm bằng hình ảnh
  //   setTimeout(() => {
  //     setIsCameraModalOpen(false);
  //     navigate('/search?image=true');
  //   }, 1500);
  // };

  // Xử lý hiệu ứng khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const profileItems: MenuProps['items'] = [
    {
      key: 'manage',
      label: 'Quản lý tài khoản',
      icon: <UserOutlined />,
      onClick: () => (window.location.href = '/manage')
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  ];

  const [menuItems, setMenuItems] = useState<MenuProps['items']>([
    { key: 'home', label: 'Trang chủ' },
    {
      key: 'products',
      label: 'Sản phẩm',
      popupClassName: 'mega-menu-popup',
      children: []
    },
    { key: 'recommendations', label: 'Đề xuất' }
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
          { key: 'home', label: 'Trang chủ' },
          {
            key: 'products',
            label: 'Sản phẩm',
            popupClassName: 'mega-menu-popup',
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
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 flex items-center justify-between px-4 lg:px-10 bg-white/95 backdrop-blur-md ${
          scrolled ? 'h-[60px] shadow-md' : 'h-[80px] border-b border-gray-100'
        }`}
      >
        <div className='flex items-center gap-4'>
          <Button
            type='text'
            icon={<MenuOutlined className='text-xl ' />}
            className='md:hidden'
            onClick={() => setMobileMenuOpen(true)}
          />
          <img
            src={hmLogo}
            alt='Logo'
            className={`transition-all duration-300 cursor-pointer ${scrolled ? 'h-6' : 'h-8'}`}
            onClick={() => (window.location.href = '/')}
          />
        </div>

        {/* KHỐI GIỮA: Menu ngang (Chỉ hiện trên Laptop/Desktop) */}
        <nav className='flex-1 justify-between'>
          <Menu
            mode='horizontal'
            items={menuItems}
            className='w-full justify-center bg-transparent font-semibold uppercase tracking-wider'
            style={{ border: 'none', minWidth: '400px' }}
          />
        </nav>

        {/* KHỐI PHẢI: Search & User Actions */}
        <div className='flex items-center gap-2 lg:gap-5'>
          {/* Search Bar (Desktop) */}
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={() => handleSearch(searchKeyword)}
            placeholder='Tìm kiếm sản phẩm...'
            prefix={<SearchOutlined className='text-gray-400' />}
            suffix={
              <Space>
                <AudioOutlined
                  className='hover:text-red-600 cursor-pointer text-lg'
                  onClick={() => {
                    setIsMicModalOpen(true);
                    handleVoiceSearch();
                  }}
                />
                <CameraOutlined
                  className='hover:text-red-600 cursor-pointer text-lg'
                  onClick={() => setIsCameraModalOpen(true)}
                />
              </Space>
            }
            className='hidden lg:flex w-64 rounded-full bg-gray-100 border-none h-10 hover:bg-gray-200 transition-all'
          />

          {/* Giỏ hàng với số lượng */}
          <Badge count={3} size='small' color='#E50010' offset={[-2, 5]}>
            <Button
              type='text'
              icon={<ShoppingCartOutlined className='text-2xl' />}
              className='p-0 hover:bg-transparent'
            />
          </Badge>

          <Dropdown menu={{ items: profileItems }} placement='bottomRight' arrow>
            <Avatar
              icon={<UserOutlined />}
              className='bg-black cursor-pointer ml-2 rounded-full w-7 h-7 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-gray-300 transition-all'
            />
          </Dropdown>
        </div>
      </header>

      {/* --- CÁC MODAL CHỨC NĂNG --- */}

      {/* Tìm kiếm Mobile */}
      <Modal
        open={isMobileSearchOpen}
        onCancel={() => setIsMobileSearchOpen(false)}
        footer={null}
        closable={false}
        style={{ top: 10 }}
      >
        <Input
          autoFocus
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onPressEnter={() => handleSearch(searchKeyword)}
          placeholder='Nhập từ khóa...'
          prefix={<SearchOutlined />}
          size='large'
          className='rounded-lg'
          suffix={
            <Space size='middle'>
              <AudioOutlined
                className='text-red-500 text-lg cursor-pointer'
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setIsMicModalOpen(true);
                  handleVoiceSearch();
                }}
              />
              <CameraOutlined
                className='text-red-500 text-lg cursor-pointer'
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setIsCameraModalOpen(true);
                }}
              />
            </Space>
          }
        />
      </Modal>

      {/* Tìm kiếm Hình ảnh AI */}
      <Modal
        title='Tìm kiếm bằng hình ảnh'
        open={isCameraModalOpen}
        onCancel={() => setIsCameraModalOpen(false)}
        footer={null}
        centered
      >
        <Dragger className='py-10 bg-gray-50 rounded-2xl border-dashed border-2 hover:border-black transition-all mt-4'>
          <p className='ant-upload-drag-icon'>
            <InboxOutlined className='text-red-500 text-5xl' />
          </p>
          <p className='ant-upload-text font-bold'>Kéo thả ảnh vào đây để AI tìm sản phẩm</p>
          <p className='ant-upload-hint mt-2 text-gray-500'>
            Hệ thống sẽ tự động nhận diện trang phục và gợi ý món đồ tương tự.
          </p>
        </Dragger>
      </Modal>

      {/* Tìm kiếm Giọng nói AI */}
      <Modal
        open={isMicModalOpen}
        onCancel={() => setIsMicModalOpen(false)}
        footer={null}
        centered
        width={350}
        closable={false}
      >
        <div className='text-center py-6'>
          <Title level={4}>Đang lắng nghe...</Title>
          <div className='audio-wave my-8'>
            <div className='bar'></div>
            <div className='bar'></div>
            <div className='bar'></div>
            <div className='bar'></div>
          </div>
          <Button
            shape='circle'
            danger
            size='large'
            icon={<AudioOutlined />}
            className='w-16 h-16 shadow-lg hover:scale-105 transition-transform'
            onClick={() => setIsMicModalOpen(false)}
          />
        </div>
      </Modal>

      {/* Menu Drawer (Mobile) */}
      <Drawer title='DANH MỤC' placement='left' onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen}>
        <Menu mode='inline' items={menuItems} className='border-none font-medium' />
      </Drawer>

      {/* Padding để nội dung không bị Header che khuất */}
      <div className='h-[80px]'></div>
    </>
  );
};

export default AppHeader;
