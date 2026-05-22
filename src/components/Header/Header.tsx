import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Dropdown,
  Avatar,
  Menu,
  Space,
  Modal,
  Upload,
  Typography,
  Drawer,
  Badge,
  message,
  Popover,
  List,
  InputNumber,
  Popconfirm
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  AudioOutlined,
  CameraOutlined,
  MenuOutlined,
  InboxOutlined,
  DeleteOutlined
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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // ... (các import khác giữ nguyên)

  const { Text } = Typography;

  const [cartItems, setCartItems] = useState<any[]>([]);

  const fetchCartItems = async () => {
    try {
      if (!localStorage.getItem('accessToken')) return; // Chỉ lấy nếu có token
      const res = await http.get('/api/Cart');
      setCartItems(res.data);
    } catch (error) {
      console.log('Error fetching cart:', error);
    }
  };

  useEffect(() => {
    fetchCartItems();

    const handleCartUpdate = () => {
      fetchCartItems();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const handleUpdateQuantity = async (id: number, quantity: number | null) => {
    if (!quantity || quantity < 1) return;
    try {
      await http.put(`/api/Cart/${id}`, quantity, {
        headers: { 'Content-Type': 'application/json' }
      });
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: any) {
      message.error(error.message || 'Lỗi cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      await http.delete(`/api/Cart/${id}`);
      window.dispatchEvent(new Event('cart-updated'));
      message.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error: any) {
      message.error(error.message || 'Lỗi khi xóa sản phẩm');
    }
  };

  const handleSearch = (value: string) => {
    console.log('run: ', value);
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

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

    // SỬ DỤNG BIẾN CỤC BỘ ĐỂ LƯU KẾT QUẢ CUỐI CÙNG
    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      finalTranscript = ''; // Reset lại biến cục bộ mỗi khi bắt đầu nghe
      setIsMicModalOpen(true);
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;

      // Vẫn set state để hiển thị chữ "Đang nghe..." trên giao diện
      setTranscript(text);

      // NHƯNG ĐỒNG THỜI CẬP NHẬT BIẾN CỤC BỘ
      finalTranscript = text;
    };

    recognition.onend = () => {
      setIsListening(false);

      // SỬ DỤNG BIẾN CỤC BỘ (finalTranscript) THAY VÌ STATE (transcript)
      if (finalTranscript.trim()) {
        setTimeout(() => {
          setIsMicModalOpen(false);
          handleSearch(finalTranscript); // Truyền trực tiếp kết quả cuối cùng vào hàm tìm kiếm
        }, 1000);
      } else {
        setTimeout(() => setIsMicModalOpen(false), 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setIsMicModalOpen(false);
      message.error('Có lỗi xảy ra khi nhận diện giọng nói.');
    };

    recognition.start();
  };

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
      key: 'history',
      label: 'Đơn mua',
      icon: <ShoppingCartOutlined />,
      onClick: () => navigate('/history')
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }
  ];

  const [menuItems, setMenuItems] = useState<MenuProps['items']>([
    { key: 'home', label: 'Trang chủ', onClick: () => navigate('/') },
    {
      key: 'products',
      label: 'Sản phẩm',
      popupClassName: 'mega-menu-popup',
      children: []
    },
    { key: 'recommendations', label: 'Đề xuất', onClick: () => navigate('/?tab=recommended') }
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
          label: cat.name,
          onClick: () => navigate(`/?tab=category&category=${cat.id}`)
        }));

        setMenuItems([
          { key: 'home', label: 'Trang chủ', onClick: () => navigate('/') },
          {
            key: 'products',
            label: 'Sản phẩm',
            popupClassName: 'mega-menu-popup',
            children: dynamicChildren as ItemType<MenuItemType>[]
          },
          { key: 'recommendations', label: 'Đề xuất', onClick: () => navigate('/?tab=recommended') }
        ]);
      } catch (error) {
        console.error('Lỗi khi tải danh mục', error);
      }
    };

    fetchCategories();
  }, []);

  // Giao diện hộp thoại bật ra khi trỏ chuột vào Giỏ hàng
  const cartContent = (
    <div className='w-[350px]'>
      <div className='text-gray-400 text-sm mb-2 px-1'>Sản phẩm Mới thêm</div>
      <div className='max-h-[300px] overflow-y-auto custom-scrollbar'>
        <List
          itemLayout='horizontal'
          dataSource={cartItems}
          renderItem={(item) => (
            <List.Item className='hover:bg-gray-50 px-2 transition-colors border-b-0 py-2 relative group'>
              <List.Item.Meta
                avatar={
                  <img
                    src={'http://localhost:5000/images/' + item.product.imageUrl}
                    alt={item.product.productName}
                    className='w-10 h-10 object-cover border border-gray-200 cursor-pointer'
                    onClick={() => navigate(`/product/${item.product.productCode}`)}
                  />
                }
                title={
                  <Text
                    className='text-sm font-medium text-gray-800 line-clamp-1 cursor-pointer hover:text-[#ee4d2d]'
                    onClick={() => navigate(`/product/${item.product.productCode}`)}
                  >
                    {item.product.productName}
                  </Text>
                }
                description={
                  <Text className='text-[#ee4d2d] text-sm'>
                    ₫{new Intl.NumberFormat('vi-VN').format(item.product.price)} - Size: {item.product.size}
                  </Text>
                }
              />
              <div className='flex flex-col items-end gap-2'>
                <Popconfirm
                  title='Xóa sản phẩm này?'
                  onConfirm={() => handleRemoveItem(item.id)}
                  okText='Xóa'
                  cancelText='Hủy'
                  placement='left'
                >
                  <Button
                    type='text'
                    danger
                    size='small'
                    icon={<DeleteOutlined />}
                    className='opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2'
                  />
                </Popconfirm>
                <div className='flex items-center mt-2'>
                  <InputNumber
                    min={1}
                    max={99}
                    size='small'
                    value={item.quantity}
                    onChange={(val) => handleUpdateQuantity(item.id, val)}
                    className='w-14 text-center'
                  />
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
      <div className='flex items-center justify-between mt-2 pt-3 border-t border-gray-100'>
        <Text className='text-xs text-gray-500'>{cartItems.length} Sản phẩm mới thêm</Text>
        <Button
          type='primary'
          className='bg-[#ee4d2d] hover:!bg-[#ee4d2d]/90 border-none font-medium text-sm px-6'
          onClick={() => navigate('/cart')}
        >
          Xem Giỏ Hàng
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 flex items-center justify-between px-4 lg:px-10 bg-white/95 backdrop-blur-md ${
          scrolled ? 'h-[60px] shadow-md' : 'h-[80px] border-b border-gray-100'
        }`}
      >
        <div className='flex items-center gap-4'>
          <Button type='text' icon={<MenuOutlined className='text-xl ' />} onClick={() => setMobileMenuOpen(true)} />
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
                    startVoiceSearch();
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
          {/* Giỏ hàng với hiệu ứng Popover */}
          <Popover
            content={cartContent}
            placement='bottomRight'
            trigger='hover'
            arrow={false}
            overlayInnerStyle={{ padding: '12px' }}
          >
            <Badge count={cartItems.length} size='small' color='#ee4d2d' offset={[-2, 5]}>
              <Button
                type='text'
                icon={
                  <ShoppingCartOutlined className='text-2xl text-gray-700 hover:text-[#ee4d2d] transition-colors' />
                }
                className='p-0 hover:bg-transparent'
                onClick={() => navigate('/cart')}
              />
            </Badge>
          </Popover>

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
                  startVoiceSearch();
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
        <Dragger
          accept='image/*'
          beforeUpload={(file) => {
            // Lớp phòng thủ 2: Chặn khi kéo thả file sai định dạng
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
              message.error(`${file.name} không phải là định dạng hình ảnh! Vui lòng chỉ tải lên ảnh.`);
              return Upload.LIST_IGNORE; // Lệnh của Antd: Hủy bỏ việc đưa file này vào danh sách
            }

            // Tùy chọn thêm: Giới hạn dung lượng ảnh (ví dụ: < 5MB)
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
              message.error('Hình ảnh phải nhỏ hơn 5MB!');
              return Upload.LIST_IGNORE;
            }

            // Nếu qua hết các bài test, gọi hàm xử lý up ảnh lên Backend ở đây
            // handleImageSearch(file);

            return false; // Trả về false để chặn Ant Design tự động gọi API upload mặc định
          }}
          className='py-10 bg-gray-50 rounded-2xl border-dashed border-2 hover:border-black transition-all mt-4'
        >
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
          <Title level={4}>{transcript || 'Đang lắng nghe...'}</Title>
          <div className={`audio-wave my-8 ${isListening ? 'listening' : ''}`}>
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
            className={`w-16 h-16 shadow-lg transition-transform ${isListening ? 'scale-110 animate-pulse' : ''}`}
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
