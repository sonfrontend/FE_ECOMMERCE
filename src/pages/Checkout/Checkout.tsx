import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Checkbox, Radio, Space, Button, Typography, message, Skeleton, Modal } from 'antd';
import http from '@/apis/http';
import { PaymentMethod } from '@/contants/PaymentMethod.enum';


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
  
  // Voucher state
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  
  // Available vouchers & promotions
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);
  const [activePromotion, setActivePromotion] = useState<any>(null);
  const [isVoucherModalVisible, setIsVoucherModalVisible] = useState(false);

  // Shipping fees state
  const [shippingFeesList, setShippingFeesList] = useState<any[]>([]);


  
  // Lấy selectedRowKeys từ Router State
  const selectedRowKeys: number[] = location.state?.selectedRowKeys || [];

  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      message.error("Vui lòng chọn sản phẩm trước khi thanh toán");
      navigate('/cart');
      return;
    }
    fetchCartItems();
    fetchActiveVouchers();
    fetchActivePromotion();
    fetchShippingFees();
  }, [selectedRowKeys, navigate]);

  const fetchShippingFees = async () => {
    try {
      const res = await http.get('/api/ShippingFee');
      setShippingFeesList(res.data);
    } catch (error) {
      console.error("Không thể tải danh sách phí vận chuyển", error);
    }
  };

  const fetchActivePromotion = async () => {
    try {
      const res = await http.get('/api/Promotion/active');
      if (res.data && res.data.length > 0) {
        setActivePromotion(res.data[0]);
      }
    } catch (error) {
      console.error("Không thể tải promotion", error);
    }
  };

  const fetchActiveVouchers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const voucherRes = await http.get('/api/Voucher/my-vouchers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (voucherRes.data) {
        setAvailableVouchers(voucherRes.data);
      }
    } catch (error) {
      console.error("Không thể tải danh sách voucher", error);
    }
  };

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

  const subtotal = calculateSubtotal();
  
  // Calculate final discount based on voucher OR promotion
  let finalDiscountAmount = 0;
  if (appliedVoucher) {
    finalDiscountAmount = discountAmount;
  } else if (activePromotion) {
    finalDiscountAmount = subtotal * (activePromotion.discountPercentage / 100);
  }

  const total = subtotal + shippingFee - finalDiscountAmount;

  const handleProvinceChange = (value: string) => {
    const feeConfig = shippingFeesList.find(f => f.provinceName === value);
    if (feeConfig) {
      setShippingFee(feeConfig.fee);
    } else {
      setShippingFee(0); // Default fee if not configured
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    
    try {
      setIsValidatingVoucher(true);
      const subtotal = calculateSubtotal();
      
      const res = await http.post('/api/Voucher/validate', {
        code: voucherCode,
        orderTotal: subtotal
      });
      
      setDiscountAmount(res.data.discountAmount);
      setAppliedVoucher(voucherCode);
      message.success(res.data.message || 'Áp dụng mã giảm giá thành công!');
    } catch (error: any) {
      setDiscountAmount(0);
      setAppliedVoucher(null);
      message.error(error.response?.data || 'Mã giảm giá không hợp lệ');
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleSelectVoucher = (code: string) => {
    setVoucherCode(code);
    setIsVoucherModalVisible(false);
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
        voucherCode: appliedVoucher,
        selectedCartItemIds: selectedRowKeys,
        email: values.email 
      };

      const response = await http.post('/api/Order', payload);
      
      window.dispatchEvent(new Event('cart-updated'));

      if (values.paymentMethod === PaymentMethod.VNPAY) {
        // Gọi API VNPay và chuyển hướng
        const vnpayRes = await http.post('/api/Payment/vnpay-create', { InternalOrderId: response.data.orderId });
        if (vnpayRes.data.url) {
          window.location.href = vnpayRes.data.url;
        } else {
          message.error('Lỗi lấy link thanh toán VNPay');
        }
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
                  <Select size='large' placeholder='Chọn Tỉnh/Thành phố' onChange={handleProvinceChange} options={
                    shippingFeesList.length > 0 
                      ? shippingFeesList.map(f => ({ value: f.provinceName, label: f.provinceName }))
                      : [
                          { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
                          { value: 'Hà Nội', label: 'Hà Nội' },
                          { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                          { value: 'Khác', label: 'Khác' }
                        ]
                  } />
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

                {/* VOUCHER BẮT ĐẦU */}
                <div className='mb-4 pt-4 border-t'>
                  <div className="flex justify-between items-center mb-2">
                    <Title level={5} className='uppercase text-gray-800 mb-0'>Mã giảm giá</Title>
                    <Button type="link" className="p-0 text-[#ee4d2d] font-bold" onClick={() => setIsVoucherModalVisible(true)}>
                      Chọn Mã
                    </Button>
                  </div>
                  <div className='flex gap-2'>
                    <Input 
                      placeholder='Nhập mã giảm giá' 
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      disabled={appliedVoucher !== null}
                    />
                    {appliedVoucher ? (
                      <Button 
                        danger 
                        onClick={() => {
                          setAppliedVoucher(null);
                          setDiscountAmount(0);
                          setVoucherCode('');
                        }}
                      >
                        Hủy
                      </Button>
                    ) : (
                      <Button 
                        type="primary" 
                        className="bg-[#82b541] border-none"
                        onClick={handleApplyVoucher}
                        loading={isValidatingVoucher}
                      >
                        Áp dụng
                      </Button>
                    )}
                  </div>
                </div>

                {appliedVoucher ? (
                  <div className='flex justify-between text-sm mb-4 font-medium text-[#ee4d2d]'>
                    <span>Giảm giá (Voucher)</span>
                    <span className='font-bold'>- {new Intl.NumberFormat('vi-VN').format(finalDiscountAmount)}VNĐ</span>
                  </div>
                ) : activePromotion ? (
                  <div className='flex justify-between text-sm mb-4 font-medium text-[#82b541]'>
                    <span>Khuyến mãi toàn sàn (-{activePromotion.discountPercentage}%)</span>
                    <span className='font-bold'>- {new Intl.NumberFormat('vi-VN').format(finalDiscountAmount)}VNĐ</span>
                  </div>
                ) : null}
                {/* VOUCHER KẾT THÚC */}

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
                        <Radio value={PaymentMethod.VNPAY} className='font-bold text-gray-800 w-full'>
                          Thanh toán qua VNPAY
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


        {/* MODAL CHỌN VOUCHER */}
        <Modal
          title={<span className="text-lg font-bold text-gray-800">Chọn Mã Giảm Giá</span>}
          open={isVoucherModalVisible}
          onCancel={() => setIsVoucherModalVisible(false)}
          footer={null}
          width={500}
        >
          <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {availableVouchers.length > 0 ? (
              availableVouchers.map((voucher) => {
                // const isEligible = subtotal >= voucher.minOrderValue && voucher.StartDate <= new Date() && voucher.EndDate >= new Date() && voucher.IsLocked === false;
                const isEligible = subtotal >= voucher.minOrderValue ;
                return (
                  <div 
                    key={voucher.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${isEligible ? 'bg-white border-[#ee4d2d] hover:bg-orange-50 cursor-pointer' : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'}`}
                    onClick={() => isEligible && handleSelectVoucher(voucher.code)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#ee4d2d] text-white px-2 py-1 rounded text-xs font-bold uppercase">{voucher.code}</span>
                      </div>
                      <div className="text-base font-bold text-gray-800">
                        {`Giảm ${new Intl.NumberFormat('vi-VN').format(voucher.discountValue)}đ`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Đơn tối thiểu {new Intl.NumberFormat('vi-VN').format(voucher.minOrderValue)}đ
                      </div>
                    </div>
                    {isEligible ? (
                      <Button type="primary" size="small" className="bg-[#ee4d2d] border-none ml-2">Dùng ngay</Button>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium ml-2 w-16 text-right">Không đủ ĐK</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chưa có mã giảm giá nào.
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Checkout;
