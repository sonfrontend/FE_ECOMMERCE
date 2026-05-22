import React, { useEffect, useState } from 'react';
import {
  Typography, Button, List, message, Skeleton, Empty,
  InputNumber, Popconfirm, Modal, Form, Input, Checkbox, Radio, Space, Tag, Statistic
} from 'antd';
import { DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import http from '@/apis/http';

// BẮT BUỘC: Nhớ đảm bảo file này nằm cùng thư mục với Cart.tsx
import PayPalPaymentButton from './PayPalPaymentButton'; 
import { PaymentMethod } from '@/contants/PaymentMethod.enum';
import OrderTimer from '../Order/OrderTimer';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

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
  
  // State Form Checkout
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [checkoutForm] = Form.useForm();

  // State Modal Thanh toán Online
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [createdOrderInfo, setCreatedOrderInfo] = useState<{ id: number; date: string; totalAmount: number } | null>(null);

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


  // -------------------------------------------------------------
  // HÀM 1: CHỈ XỬ LÝ LOGIC TẠO ĐƠN VÀ RẼ NHÁNH
  // -------------------------------------------------------------
  const executeOrderCreation = async (checkoutData: any) => {
    try {
      setLoading(true);
      
      const payload = { 
        ...checkoutData, 
        selectedCartItemIds: selectedRowKeys 
      };

      console.log('Dữ liệu gửi đi khi tạo đơn:', payload);

      // GỌI API ĐÃ ĐƯỢC TÁCH RA FILE RIÊNG
      const response = await http.post('/api/Order', payload);
      
      
      window.dispatchEvent(new Event('cart-updated'));
      setCartItems((prev) => prev.filter((item) => !selectedRowKeys.includes(item.id)));
      setSelectedRowKeys([]);
      setIsCheckoutModalVisible(false);

      if (checkoutData.paymentMethod === PaymentMethod.PAYPAL) {
        setCreatedOrderInfo({ id: response.data.orderId, date: response.data.orderDate,totalAmount: response.data.totalAmount });
        setIsPaymentModalVisible(true);
      } else {
        message.success('Đặt hàng thành công!');
        navigate('/history');
      }

    } catch (error: any) {
      message.error(error.response?.data || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // HÀM 2: KIỂM TRA FORM HỢP LỆ RỒI MỚI CHUYỂN GIAO CHO HÀM 1
  // -------------------------------------------------------------
  const handleConfirmOrder = async () => {
    try {
      const values = await checkoutForm.validateFields();
      console.log(values);
      
      await executeOrderCreation(values);
    } catch (errorInfo) {
      console.log('Khách điền thiếu thông tin:', errorInfo);
    }
  };

  if (loading && cartItems.length === 0) {
    return <div className='max-w-[1200px] mx-auto p-4 py-8'><Skeleton active paragraph={{ rows: 10 }} /></div>;
  }

  console.log(checkoutForm.getFieldValue('paymentMethod'));
  

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
                          <img src={`http://localhost:5000/images/${item.product.imageUrl}`} alt="img" className='w-20 h-24 object-cover border' />
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
                <Title level={4} className='mb-6 border-b pb-4'>Tóm tắt đơn hàng</Title>
                <div className='flex justify-between mb-6 border-t pt-4'>
                  <Text className='text-base font-bold'>Tổng thanh toán</Text>
                  <Text className='text-[#ee4d2d] text-2xl font-bold'>
                    ₫{new Intl.NumberFormat('vi-VN').format(totalPrice)}
                  </Text>
                </div>
                <Button
                  size='large'
                  className={`w-full text-white border-none font-medium text-base h-[48px] ${selectedRowKeys.length === 0 ? 'bg-gray-300' : 'bg-[#ee4d2d] hover:!bg-[#f05d40]'}`}
                  onClick={() => setIsCheckoutModalVisible(true)}
                  disabled={selectedRowKeys.length === 0}
                >
                  Mua Hàng ({selectedRowKeys.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: FORM NHẬP ĐỊA CHỈ & CHỌN PHƯƠNG THỨC THANH TOÁN                  */}
        {/* ========================================================================= */}
        <Modal
          title='Thông tin nhận hàng'
          open={isCheckoutModalVisible}
          onCancel={() => setIsCheckoutModalVisible(false)}
          onOk={handleConfirmOrder} // GỌI HÀM KIỂM TRA TẠI ĐÂY
          okText='Tạo Đơn Hàng'
          cancelText='Hủy'
          confirmLoading={loading}
        >
          {/* KHÔNG CÒN onFinish TRONG FORM NỮA */}
          <Form form={checkoutForm} layout='vertical' initialValues={{ paymentMethod: PaymentMethod.COD }}>
            <Form.Item name='recipientName' label='Tên người nhận' rules={[{ required: true, message: 'Vui lòng nhập tên người nhận!' }]}>
              <Input placeholder='Nhập tên người nhận' />
            </Form.Item>
            <Form.Item name='phoneNumber' label='Số điện thoại' rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
              <Input placeholder='Nhập số điện thoại' />
            </Form.Item>
            <Form.Item name='shippingAddress' label='Địa chỉ giao hàng' rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}>
              <Input.TextArea rows={3} placeholder='Nhập địa chỉ chi tiết' />
            </Form.Item>
            
            <Form.Item name='paymentMethod' label='Phương thức thanh toán'>
              <Radio.Group>
                <Space direction='vertical'>
                  <Radio value={PaymentMethod.COD}>Thanh toán khi nhận hàng (COD)</Radio>
                  <Radio value={PaymentMethod.PAYPAL}>Thanh toán quốc tế (PayPal)</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 2: HIỂN THỊ NÚT PAYPAL HOẶC ẢNH QR VÀ ĐẾM NGƯỢC 2 PHÚT              */}
        {/* ========================================================================= */}
        <Modal
          title={<span className="text-lg font-bold text-gray-800">Thanh toán Đơn hàng #{createdOrderInfo?.id}</span>}
          open={isPaymentModalVisible}
          onCancel={() => {
            setIsPaymentModalVisible(false);
            message.info('Vui lòng thanh toán sớm để không bị hủy đơn.');
            navigate('/history');
          }}
          footer={[
            <Button key="cancel" onClick={() => { setIsPaymentModalVisible(false); navigate('/history'); }}>
              Thanh toán sau
            </Button>,
            <Button key="submit" type="primary" className="bg-[#ee4d2d] border-none" onClick={() => navigate('/history')}>
              Tôi đã thanh toán xong
            </Button>
          ]}
          centered closable={false} maskClosable={false}
        >
          {createdOrderInfo && (
            <div className='flex flex-col items-center justify-center py-4'>
              
              <OrderTimer 
                startTime={createdOrderInfo.date} 
                onExpire={() => {
                  setIsPaymentModalVisible(false);
                  message.error('Đã hết 2 phút! Đơn hàng của bạn đã tự động bị hủy.');
                  navigate('/history');
                }} 
              />

              <div className='p-6 border border-gray-200 rounded-xl bg-white shadow-sm text-center w-full max-w-sm'>
                <Text className='block mb-2 font-medium text-gray-600'>Tổng tiền cần thanh toán</Text>
                <Text className='block text-3xl font-bold text-[#ee4d2d] mb-6'>
                  ₫{new Intl.NumberFormat('vi-VN').format(createdOrderInfo.totalAmount)}
                </Text>

                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center w-full">
                  {checkoutForm.getFieldValue('paymentMethod') === 'PAYPAL' && (
                    
                    // THÊM THẺ PROVIDER BỌC Ở NGOÀI CÙNG VÀ ĐIỀN CLIENT ID CỦA BẠN VÀO
                    <PayPalScriptProvider options={{ 
                      clientId: "AeUy_yLBmbpd2uRXsO9dyn9zCCGzoegIVfbLB7UN1Ze2bxb2QdsDnr4-yvKL4fGgSg_vxp1yard3YvY8", 
                      currency: "USD" 
                    }}>
                      <PayPalPaymentButton 
                        orderId={createdOrderInfo.id.toString()} 
                        amount={createdOrderInfo.totalAmount} 
                      />
                    </PayPalScriptProvider>
                    
                  )}
                </div>
                <Text className='text-sm text-gray-500'>Nếu bạn đã thanh toán, vui lòng bấm "Tôi đã thanh toán xong" để chúng tôi xác nhận và xử lý đơn hàng của bạn nhanh hơn.</Text>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};

export default Cart;