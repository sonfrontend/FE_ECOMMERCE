import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Input, Select, Checkbox, Radio, Space, Button, Typography, message, Skeleton, Modal } from 'antd';
import http from '@/apis/http';
import { PaymentMethod } from '@/contants/PaymentMethod.enum';
import { getImageUrl } from '@/utils/imageUrl';


const { Title, Text } = Typography;

interface CartItem {
  id: number;
  quantity: number;
  product: {
    productId: string;
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

  // Address Book state
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);


  
  // Lấy selectedRowKeys từ Router State
  const selectedRowKeys: number[] = location.state?.selectedRowKeys || [];

  useEffect(() => {
    if (selectedRowKeys.length === 0) {
      message.error("Vui lòng chọn sản phẩm trước khi thanh toán");
      navigate('/manage', { state: { tab: '7' } });
      return;
    }
    fetchCartItems();
    fetchActiveVouchers();
    fetchActivePromotion();
    fetchShippingFees();
    fetchUserAddresses();
  }, [selectedRowKeys, navigate]);

  useEffect(() => {
    const currentProvince = checkoutForm.getFieldValue('province');
    if (currentProvince && shippingFeesList.length > 0) {
      handleProvinceChange(currentProvince);
    }
  }, [shippingFeesList]);

  const fetchUserAddresses = async () => {
    try {
      const res = await http.get('/api/UserAddress');
      setUserAddresses(res.data);
      // Auto fill default address
      const defaultAddr = res.data.find((a: any) => a.isDefault);
      if (defaultAddr) {
        handleSelectAddress(defaultAddr);
      }
    } catch (error) {
      console.log('User not logged in or no addresses');
    }
  };

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
      const res = await http.get('/api/Promotion/available-for-user');
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
    if (!value) {
      setShippingFee(0);
      return;
    }
    
    // Nếu shippingFeesList chưa load kịp thì defer việc xử lý lại cho useEffect
    if (shippingFeesList.length === 0) return;

    const feeConfig = shippingFeesList.find(f => f.provinceName?.toLowerCase() === value?.toLowerCase());
    
    if (feeConfig) {
      // Ensure the form value exactly matches the select option label case (e.g. 'Hồ Chí Minh' instead of 'HỒ CHÍ MINH')
      checkoutForm.setFieldsValue({ province: feeConfig.provinceName });
      setShippingFee(feeConfig.fee);
    } else {
      setShippingFee(0); // Để 0 đồng nếu chưa có tỉnh hoặc không tìm thấy
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

  const handleSelectAddress = (addr: any) => {
    const nameParts = addr.recipientName.split(' ');
    const lastName = nameParts.pop() || '';
    const firstName = nameParts.join(' ') || '';
    
    let address = addr.address || '';
    let ward = '';
    let province = '';
    
    const parts = address.split(', ').map((p: string) => p.trim());
    if (parts.length >= 3) {
      province = parts.pop() || '';
      ward = parts.pop() || '';
      address = parts.join(', ');
    } else if (parts.length === 2) {
      province = parts.pop() || '';
      address = parts[0];
    }
    
    checkoutForm.setFieldsValue({
      firstName,
      lastName,
      phoneNumber: addr.phoneNumber,
      email: addr.email,
      address: address,
      ward: ward,
      province: province
    });
    
    setSelectedAddressId(addr.id);
    
    if (province) {
      handleProvinceChange(province);
    }
    
    setIsAddressModalVisible(false);
    message.success('Đã điền thông tin từ Sổ địa chỉ');
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
      
      // Save address to address book if checked
      if (values.saveAddress) {
        try {
          await http.post('/api/UserAddress', {
            recipientName: values.firstName + ' ' + values.lastName,
            phoneNumber: values.phoneNumber,
            email: values.email,
            address: fullAddress,
            isDefault: true
          });
        } catch (err) {
          console.error('Failed to save address', err);
        }
      }
      
      window.dispatchEvent(new Event('cart-updated'));

      // Thông báo cho Admin
      try {
        await http.post('/api/Notification/notify-admin', {
          actionCode: 'CHECKOUT',
          details: `Đơn hàng #${response.data.orderId || ''} trị giá ${total.toLocaleString('vi-VN')}đ`,
          relatedId: response.data.orderId ? response.data.orderId.toString() : undefined
        });
      } catch (err) {
        console.error('Failed to notify admin', err);
      }

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
        <Title level={3} className='mb-6 uppercase text-gray-700'>Thanh toán</Title>
        <Form form={checkoutForm} layout='vertical' onFinish={handleConfirmOrder} initialValues={{ paymentMethod: PaymentMethod.COD }}>
          <div className='flex flex-col gap-8 laptop:flex-row'>
            
            {/* Cột trái: Form thông tin */}
            <div className='flex-2'>
              <div className='flex justify-between items-center mb-4'>
                <Title level={5} className='uppercase tracking-wider text-gray-700 !mb-0'>Thông tin thanh toán</Title>
                <Button type='primary' ghost onClick={() => setIsAddressModalVisible(true)}>
                  Chọn thông tin địa chỉ
                </Button>
              </div>
              
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
                  {cartItems.map((item, index) => (
                    <div key={index} className='flex justify-between items-center py-3 border-b border-gray-200'>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-16 shrink-0 border border-gray-200 rounded overflow-hidden'>
                          <img src={getImageUrl(item.product.imageUrl) ?? ''} alt={item.product.productName} className='w-full h-full object-cover' />
                        </div>
                        <div>
                          <span className='text-gray-700 text-sm'>{item.product.productName} × <strong>{item.quantity}</strong></span>
                          <div className='text-xs text-gray-400 mt-1'>
                            Màu: {item.product.color}, Size: {item.product.size}
                          </div>
                        </div>
                      </div>
                      <span className='font-bold text-gray-800 whitespace-nowrap ml-4'>{new Intl.NumberFormat('vi-VN').format(item.product.price * item.quantity)}VNĐ</span>
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
                Bạn chưa có mã giảm giá nào.
              </div>
            )}
          </div>
        </Modal>

        <Modal
          title="Chọn địa chỉ giao hàng"
          open={isAddressModalVisible}
          onCancel={() => setIsAddressModalVisible(false)}
          footer={
            <Button 
              type="dashed" 
              block 
              className="mt-4"
              onClick={() => navigate('/manage', { state: { tab: '4' } })}
            >
              Thêm / Chỉnh sửa thông tin địa chỉ
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            {userAddresses.length > 0 ? (
              userAddresses.map(addr => (
                <div 
                  key={addr.id} 
                  className={`border p-3 rounded cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-[#82b541] shadow-md bg-[#f6faf0] border-2' : 'hover:border-primary border-gray-200'}`} 
                  onClick={() => handleSelectAddress(addr)}
                >
                  <div className="font-bold mb-1">{addr.recipientName} {addr.isDefault && <span className="text-primary text-xs ml-2 border border-primary px-1 rounded">Mặc định</span>}</div>
                  <div className="text-gray-600 text-sm mb-1"><span className="font-medium text-gray-700">SĐT:</span> {addr.phoneNumber}</div>
                  {addr.email && <div className="text-gray-600 text-sm mb-1"><span className="font-medium text-gray-700">Email:</span> {addr.email}</div>}
                  <div className="text-gray-500 text-sm"><span className="font-medium text-gray-700">Địa chỉ:</span> {addr.address}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">Bạn chưa lưu địa chỉ nào trong Sổ địa chỉ.</p>
                <p className="text-sm text-gray-400">Gợi ý: Hãy điền thông tin ở form bên ngoài và tick chọn <b>"Lưu thông tin giao hàng"</b> để lưu lại nhé!</p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Checkout;
