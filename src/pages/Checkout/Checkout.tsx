import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Checkbox, Radio, Space, Button, Typography, message, Skeleton, Modal } from 'antd';
import http from '@/apis/http';
import { PaymentMethod } from '@/contants/PaymentMethod.enum';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PayPalPaymentButton from '../Cart/PayPalPaymentButton';
import OrderTimer from '../Order/OrderTimer';

const { Title, Text } = Typography;

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

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkoutForm] = Form.useForm();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(0);
  
  // State Modal Thanh toán Online
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [createdOrderInfo, setCreatedOrderInfo] = useState<{ id: number; date: string; totalAmount: number } | null>(null);
  
  // Lấy selectedRowKeys từ Router State
  const selectedRowKeys: number[] = location.state?.selectedRowKeys || [];

  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      message.error("Vui lòng chọn sản phẩm trước khi thanh toán");
      navigate('/cart');
      return;
    }
    fetchCartItems();
  }, [selectedRowKeys, navigate]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Cart');
      // Chỉ giữ lại các item được chọn
      const selectedItems = res.data.filter((item: CartItem) => selectedRowKeys.includes(item.id));
      setCartItems(selectedItems);
    } catch (error) {
      message.error('Không thể tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  const handleProvinceChange = (value: string) => {
    if (value === 'Hồ Chí Minh') {
      setShippingFee(10000);
    } else if (value) {
      setShippingFee(25000);
    } else {
      setShippingFee(0);
    }
  };

  const handleConfirmOrder = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      const fullAddress = `${values.address}, ${values.ward || ''}, ${values.province}`;
      
      const payload = { 
        recipientName: values.firstName + ' ' + values.lastName,
        phoneNumber: values.phoneNumber,
        shippingAddress: fullAddress,
        paymentMethod: values.paymentMethod,
        shippingFee: shippingFee,
        selectedCartItemIds: selectedRowKeys 
      };

      const response = await http.post('/api/Order', payload);
      
      window.dispatchEvent(new Event('cart-updated'));

      if (values.paymentMethod === PaymentMethod.PAYPAL) {
        setCreatedOrderInfo({ id: response.data.orderId, date: response.data.orderDate, totalAmount: response.data.totalAmount });
        setIsPaymentModalVisible(true);
      } else {
        message.success('Đặt hàng thành công!');
        navigate('/history');
      }

    } catch (error: any) {
      message.error(error.response?.data || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className='max-w-[1200px] mx-auto p-4 py-8'><Skeleton active paragraph={{ rows: 10 }} /></div>;
  }

  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee;

  return (
    <div className='bg-[#f5f5f5] min-h-screen py-8 font-sans'>
      <div className='max-w-[1200px] mx-auto px-4'>
        <Title level={3} className='mb-6 uppercase'>Thanh toán</Title>
        <Form form={checkoutForm} layout='vertical' onFinish={handleConfirmOrder} initialValues={{ paymentMethod: PaymentMethod.COD }}>
          <div className='flex flex-col gap-8 laptop:flex-row'>
            
            {/* Cột trái: Form thông tin */}
            <div className='flex-2'>
              <Title level={5} className='mb-4 uppercase tracking-wider text-gray-700'>Thông tin thanh toán</Title>
              
              <div className='flex gap-4'>
                <Form.Item name='firstName' label='Tên' className='flex-1' rules={[{ required: true, message: 'Nhập tên' }]}>
                  <Input placeholder='Tên' size='large' />
                </Form.Item>
                <Form.Item name='lastName' label='Họ' className='flex-1' rules={[{ required: true, message: 'Nhập họ' }]}>
                  <Input placeholder='Họ' size='large' />
                </Form.Item>
              </div>

              <div className='flex gap-4'>
                <Form.Item name='phoneNumber' label='Số điện thoại' className='flex-1' rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                  <Input placeholder='Số điện thoại của bạn' size='large' />
                </Form.Item>
                <Form.Item name='email' label='Địa chỉ email' className='flex-1' rules={[{ required: true, message: 'Nhập email', type: 'email' }]}>
                  <Input placeholder='Email của bạn' size='large' />
                </Form.Item>
              </div>

              <Form.Item name='country' label='Quốc gia/Khu vực' initialValue='Việt Nam'>
                <Input size='large' disabled className='font-bold text-gray-800' />
              </Form.Item>

              <div className='flex gap-4'>
                <Form.Item name='province' label='Tỉnh/Thành phố' className='flex-1' rules={[{ required: true, message: 'Chọn tỉnh/thành phố' }]}>
                  <Select size='large' placeholder='Chọn Tỉnh/Thành phố' onChange={handleProvinceChange} options={[
                    { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
                    { value: 'Hà Nội', label: 'Hà Nội' },
                    { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                    { value: 'Đồng Nai', label: 'Đồng Nai' },
                    { value: 'Bình Dương', label: 'Bình Dương' },
                    { value: 'Khác', label: 'Tỉnh/Thành phố khác' },
                  ]} />
                </Form.Item>

                <Form.Item name='ward' label='Xã/Phường' className='flex-1'>
                  <Input placeholder='Nhập xã/phường' size='large' />
                </Form.Item>
              </div>

              <Form.Item name='address' label='Địa chỉ' rules={[{ required: true, message: 'Nhập địa chỉ nhà' }]}>
                <Input placeholder='Địa chỉ chi tiết (số nhà, tên đường)' size='large' />
              </Form.Item>

              <Form.Item name='notes' label='Ghi chú đơn hàng (tuỳ chọn)'>
                <Input.TextArea rows={4} placeholder='Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn.' />
              </Form.Item>
            </div>

            {/* Cột phải: Hóa đơn & Phương thức */}
            <div className='md:w-[400px] flex-1'>
              <div className='border-2 border-[#82b541] p-6 rounded-sm sticky top-[100px] bg-white'>
                <Title level={5} className='mb-4 uppercase tracking-wider text-gray-800'>Đơn hàng của bạn</Title>
                
                <div className='flex justify-between font-bold text-sm border-b pb-2 mb-4'>
                  <span>SẢN PHẨM</span>
                  <span>TẠM TÍNH</span>
                </div>

                <div className='flex flex-col gap-4 mb-4 border-b pb-4'>
                  {cartItems.map(item => (
                    <div key={item.id} className='flex justify-between items-start text-sm text-gray-600'>
                      <div className='flex-1 pr-4'>
                        {item.product.productName} × <span className='font-bold text-gray-800'>{item.quantity}</span>
                        <div className='text-xs text-gray-400 mt-1'>Màu: {item.product.color}, Size: {item.product.size}</div>
                      </div>
                      <div className='font-bold text-gray-800'>
                        {new Intl.NumberFormat('vi-VN').format(item.product.price * item.quantity)}VNĐ
                      </div>
                    </div>
                  ))}
                </div>

                <div className='flex justify-between text-sm mb-3 font-medium text-gray-600'>
                  <span>Tạm tính</span>
                  <span className='font-bold text-gray-800'>{new Intl.NumberFormat('vi-VN').format(subtotal)}VNĐ</span>
                </div>

                <div className='flex justify-between text-sm mb-4 font-medium text-gray-600'>
                  <span>Giao hàng</span>
                  <span className='font-bold text-gray-800'>{shippingFee > 0 ? `${new Intl.NumberFormat('vi-VN').format(shippingFee)}VNĐ` : 'Chưa tính'}</span>
                </div>

                <div className='flex justify-between text-base mb-6 font-bold text-gray-800 border-t pt-4'>
                  <span>Tổng</span>
                  <span>{new Intl.NumberFormat('vi-VN').format(total)}VNĐ</span>
                </div>

                {/* Phương thức thanh toán */}
                <Form.Item name='paymentMethod' className='mb-6'>
                  <Radio.Group className='w-full'>
                    <Space direction='vertical' className='w-full gap-4'>
                      <div className='p-3 bg-gray-50 border border-gray-200 rounded'>
                        <Radio value={PaymentMethod.COD} className='font-bold text-gray-800 w-full mb-2'>
                          Thanh toán khi giao hàng (COD)
                        </Radio>
                        <div className='text-sm text-gray-600 pl-6 leading-relaxed'>
                          Quý khách vui lòng thanh toán tiền mặt cho nhân viên giao hàng
                        </div>
                      </div>
                      <div className='p-3 border border-gray-200 rounded'>
                        <Radio value={PaymentMethod.PAYPAL} className='font-bold text-gray-800 w-full'>
                          Thanh toán qua PayPal
                        </Radio>
                      </div>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                <Form.Item name='agreement' valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý với điều khoản')) }]}>
                  <Checkbox className='text-sm text-gray-700 font-medium'>
                    Tôi đã đọc và đồng ý với <span className='font-bold'>điều khoản và điều kiện của website *</span>
                  </Checkbox>
                </Form.Item>

                <Button
                  htmlType='submit'
                  loading={isSubmitting}
                  className='w-full bg-[#82b541] hover:!bg-[#6f9e34] text-white font-bold text-base h-12 uppercase border-none rounded-sm'
                >
                  Đặt hàng
                </Button>

                <div className='text-xs text-gray-500 mt-4 leading-relaxed'>
                  Thông tin cá nhân của bạn sẽ được sử dụng để xử lý đơn hàng, tăng trải nghiệm sử dụng website, và cho các mục đích cụ thể khác đã được mô tả trong chính sách riêng tư.
                </div>
              </div>
            </div>
          </div>
        </Form>

        {/* MODAL THANH TOÁN ONLINE (PAYPAL) */}
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
                  <PayPalScriptProvider options={{ clientId: "AeUy_yLBmbpd2uRXsO9dyn9zCCGzoegIVfbLB7UN1Ze2bxb2QdsDnr4-yvKL4fGgSg_vxp1yard3YvY8", currency: "USD" }}>
                    <PayPalPaymentButton orderId={createdOrderInfo.id.toString()} amount={createdOrderInfo.totalAmount} />
                  </PayPalScriptProvider>
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

export default Checkout;
