import React, { useEffect, useState } from 'react';
import {
  Typography, Button, List, message, Skeleton, Empty,
  InputNumber, Popconfirm, Modal, Form, Input, Checkbox, Radio, Space, Tag, Statistic
} from 'antd';
import { DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import http from '@/apis/http';

// BẮT BUỘC: Nhớ đảm bảo file này nằm cùng thư mục với Cart.tsx
// Removed PayPalPaymentButton import
import { PaymentMethod } from '@/contants/PaymentMethod.enum';
import OrderTimer from '../Order/OrderTimer';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { getImageUrl } from '@/utils/imageUrl';

const { Title, Text } = Typography;

// =========================================================================
// COMPONENT 2: GIAO DIỆN GIỎ HÀNG VÀ CHỐT ĐƠN (MAIN)
// =========================================================================
interface CartItem {
  id: number;
  quantity: number;
  product: {
    articleId: string;
    productName: string;
    price: number;
    imageUrl: string;
    color: string;
    size: string;
  };
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // State Giỏ hàng
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Cart');
      setCartItems(res.data);
    } catch (error: any) {
      message.error('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number | null) => {
    if (!quantity || quantity < 1) return;
    try {
      await http.put(`/api/Cart/${id}`, quantity, { headers: { 'Content-Type': 'application/json' } });
      window.dispatchEvent(new Event('cart-updated'));
      setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
    } catch { message.error('Lỗi cập nhật số lượng'); }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      await http.delete(`/api/Cart/${id}`);
      window.dispatchEvent(new Event('cart-updated'));
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
      message.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch { message.error('Lỗi xóa sản phẩm'); }
  };

  const totalPrice = cartItems
    .filter((item) => selectedRowKeys.includes(item.id))
    .reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  console.log('Cart items:', cartItems, totalPrice);


  const handleCheckoutClick = () => {
    navigate('/checkout', { state: { selectedRowKeys } });
  };

  if (loading && cartItems.length === 0) {
    return <div className='max-w-[1200px] mx-auto p-4 py-8'><Skeleton active paragraph={{ rows: 10 }} /></div>;
  }
  

  return (
    <div className='bg-[#f5f5f5] min-h-screen py-8 w-full font-sans'>
      <div className='max-w-[1200px] mx-auto px-4'>
        <Title level={2} className='mb-6'>Giỏ Hàng Của Bạn</Title>

        {cartItems.length === 0 ? (
          <div className='bg-white p-12 text-center shadow-sm rounded-sm'>
            <Empty description={<span className='text-gray-500 text-lg'>Giỏ hàng trống</span>}>
              <Button type='primary' size='large' className='mt-4 bg-[#ee4d2d] border-none' onClick={() => navigate('/')}>
                Mua sắm ngay
              </Button>
            </Empty>
          </div>
        ) : (
          <div className='flex flex-col lg:flex-row gap-6'>
            
            {/* DANH SÁCH GIỎ HÀNG */}
            <div className='flex-1 bg-white p-4 shadow-sm rounded-sm'>
              <div className='border-b border-gray-100 pb-4 mb-2 flex items-center px-4'>
                <Checkbox
                  checked={cartItems.length > 0 && selectedRowKeys.length === cartItems.length}
                  onChange={(e) => setSelectedRowKeys(e.target.checked ? cartItems.map(i => i.id) : [])}
                >
                  <Text className='text-base'>Chọn tất cả ({cartItems.length})</Text>
                </Checkbox>
              </div>
              <List
                itemLayout='horizontal'
                dataSource={cartItems}
                renderItem={(item) => (
                  <List.Item
                    className='border-b border-gray-100 py-4'
                    actions={[
                      <Popconfirm key="del" title='Xóa?' onConfirm={() => handleRemoveItem(item.id)} okText='Có' cancelText='Không'>
                        <Button type='text' danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className='flex items-center gap-4'>
                          <Checkbox
                            checked={selectedRowKeys.includes(item.id)}
                            onChange={(e) => setSelectedRowKeys(prev => e.target.checked ? [...prev, item.id] : prev.filter(key => key !== item.id))}
                          />
                          <img src={getImageUrl(item.product.imageUrl)} alt="img" className='w-20 h-24 object-cover border' />
                        </div>
                      }
                      title={<Text className='text-base font-medium'>{item.product.productName}</Text>}
                      description={
                        <div className='flex flex-col mt-2'>
                          <Text className='text-gray-500 mb-2'>Màu: {item.product.color}, Size: {item.product.size}</Text>
                          <div className='flex items-center gap-6'>
                            <Text className='text-[#ee4d2d] font-medium text-lg'>
                              ₫{new Intl.NumberFormat('vi-VN').format(item.product.price)}
                            </Text>
                            <InputNumber min={1} max={99} value={item.quantity} onChange={(val) => handleUpdateQuantity(item.id, val)} />
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            {/* BẢNG TÍNH TIỀN TÓM TẮT */}
            <div className='w-full lg:w-[350px] shrink-0'>
              <div className='bg-white p-6 shadow-sm rounded-sm sticky top-[100px]'>
                {/* <Title level={4} className='mb-6 border-b pb-4'>Tóm tắt đơn hàng</Title> */}
                <div className='flex justify-between mb-6 border-t pt-4'>
                  <Text className='text-base font-bold'>Tổng thanh toán</Text>
                  <Text className='text-[#ee4d2d] text-2xl font-bold'>
                    ₫{new Intl.NumberFormat('vi-VN').format(totalPrice)}
                  </Text>
                </div>
                <Button
                  size='large'
                  className={`w-full text-white border-none font-medium text-base h-[48px] ${selectedRowKeys.length === 0 ? 'bg-gray-300' : 'bg-[#ee4d2d] hover:!bg-[#f05d40]'}`}
                  onClick={handleCheckoutClick}
                  disabled={selectedRowKeys.length === 0}
                >
                  Mua Hàng ({selectedRowKeys.length})
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Cart;