import React, { useEffect, useState } from 'react';
import { Typography, List, Tag, Skeleton, message, Card, Flex, Button, Modal } from 'antd';
import http from '@/apis/http';
import { Link } from 'react-router-dom';
import { OrderStatus } from '@/contants/OrderStatus.enum';
import OrderTimer from './OrderTimer';

// BẮT BUỘC IMPORT 2 THỨ NÀY ĐỂ MỞ CỔNG THANH TOÁN
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import PayPalPaymentButton from '../Cart/PayPalPaymentButton'; // Chỉnh lại đường dẫn tới file nút PayPal của bạn

const { Title, Text } = Typography;

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ THANH TOÁN LẠI ---
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null); // Lưu thông tin đơn hàng đang chọn để thanh toán

  // 1. TÁCH HÀM LẤY DATA RA NGOÀI ĐỂ CÓ THỂ GỌI LẠI BẤT CỨ LÚC NÀO
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Order/history');
      setOrders(res.data);
    } catch (error: any) {
      message.error(error?.response?.data || 'Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case OrderStatus.PendingPayment.toLowerCase():
      case OrderStatus.Pending.toLowerCase():
        return 'orange';
      case OrderStatus.Delivered.toLowerCase():
        return 'green';
      case OrderStatus.Cancelled.toLowerCase():
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string, paymentMethod: string) => {
    switch (status.toLowerCase()) {
      case OrderStatus.PendingPayment.toLowerCase():
        return 'Đã đặt mà chưa thanh toán';
      case OrderStatus.Pending.toLowerCase():
        return paymentMethod === 'COD' ? 'Đã đặt' : 'Đã đặt và thanh toán rồi';
      case OrderStatus.Processing.toLowerCase():
        return 'Nhận đơn và chuẩn bị đồ để giao';
      case OrderStatus.Shipped.toLowerCase():
        return 'Đang giao';
      case OrderStatus.Delivered.toLowerCase():
        return paymentMethod === 'COD' ? 'Đã nhận và thanh toán - hoàn thành' : 'Đã nhận - hoàn thành';
      case OrderStatus.Cancelled.toLowerCase():
        return 'Đã hủy';
      default:
        return status;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className='p-8 max-w-[1200px] mx-auto'>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div className='bg-[#f5f5f5] min-h-screen py-8 w-full font-sans'>
      <div className='max-w-[1200px] mx-auto px-4'>
        <Title level={2} className='mb-6'>
          Lịch sử mua hàng
        </Title>
        {orders.length === 0 ? (
          <div className='bg-white p-12 text-center shadow-sm'>
            <Text className='text-gray-500 text-lg'>Bạn chưa có đơn hàng nào.</Text>
          </div>
        ) : (
          <div className='flex flex-col gap-6'>
            {orders.map((order) => (
              <Card key={order.id} className='shadow-sm border-none' bodyStyle={{ padding: 0 }}>
                <div className='border-b px-6 py-4 flex justify-between items-center bg-gray-50'>
                  <Text className='font-semibold text-gray-800'>
                    Mã Đơn Hàng: #{order.id} | Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}
                  </Text>
                  <Flex align='center' gap={12}>
                    
                    {/* NẾU ĐANG CHỜ THANH TOÁN -> HIỂN THỊ ĐỒNG HỒ */}
                    {order.status === OrderStatus.PendingPayment && (
                      <OrderTimer 
                        startTime={order.orderDate} 
                        onExpire={async () => {
                          try {
                            await http.put(`/api/Order/${order.id}/cancel`);
                            message.error(`Đã hết 2 phút! Đơn hàng #${order.id} đã bị hủy.`);
                            fetchOrders(); 
                          } catch (error) {
                            console.error('Lỗi khi hủy đơn hàng:', error);
                          }
                        }} 
                      />
                    )}
                    
                    <Tag color={getStatusColor(order.status)} className='text-sm px-3 py-1 m-0'>
                      {getStatusText(order.status, order.paymentMethod)}
                    </Tag>
                  </Flex>
                </div>

                {/* DANH SÁCH SẢN PHẨM CỦA ĐƠN HÀNG */}
                <div className='px-6 py-4'>
                  <List
                    itemLayout='horizontal'
                    dataSource={order.orderItems}
                    renderItem={(item: any) => (
                      <List.Item className='border-b-0 py-3'>
                        <List.Item.Meta
                          avatar={
                            <img
                              src={'http://localhost:5000' + item.imageUrl}
                              className='w-20 h-20 object-cover border border-gray-200'
                              alt='product'
                            />
                          }
                          title={
                            <Link to={`/product/${item.articleId}`} className='text-base font-medium hover:text-[#ee4d2d] transition-colors'>
                              {item.productName}
                            </Link>
                          }
                          description={`Phân loại: ${item.color}, ${item.size} x ${item.quantity}`}
                        />
                        <div className='text-[#ee4d2d] font-medium text-base'>
                          ₫{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}
                        </div>
                      </List.Item>
                    )}
                  />
                </div>

                {/* TỔNG KẾT VÀ NÚT THANH TOÁN NGAY */}
                <div className='bg-[#fffbf8] px-6 py-4 border-t flex justify-between items-center'>
                  <div>
                    <Text className='text-gray-500 mb-1 text-sm block'>
                      Giao đến: {order.recipientName} - {order.phoneNumber} ({order.shippingAddress})
                    </Text>
                    <div className='flex items-center gap-2 mb-1'>
                      <Text className='text-gray-500 text-sm'>Phương thức thanh toán: <span className='font-medium text-gray-700'>{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản (PAYPAL)'}</span></Text>
                      {order.isPaid ? (
                        <Tag color="green" className="m-0 border-none px-2 rounded-md">Đã thanh toán</Tag>
                      ) : (
                        <Tag color="volcano" className="m-0 border-none px-2 rounded-md">Chưa thanh toán</Tag>
                      )}
                    </div>
                  </div>
                  
                  <div className='flex flex-col items-end gap-3'>
                    <div className='flex items-center gap-4'>
                      <Text className='text-base font-medium'>Tổng số tiền:</Text>
                      <Text className='text-[#ee4d2d] text-2xl font-bold'>
                        ₫{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}
                      </Text>
                    </div>

                    {/* 3. NÚT THANH TOÁN NGAY DÀNH CHO ĐƠN HÀNG CÒN HẠN */}
                    {order.status === OrderStatus.PendingPayment && (
                      <Button 
                        type="primary" 
                        size="large"
                        className="bg-[#ee4d2d] hover:bg-[#f05d40] border-none px-8 font-medium"
                        onClick={() => {
                          setPaymentOrder(order);
                          setIsPaymentModalVisible(true);
                        }}
                      >
                        Thanh toán ngay
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL THANH TOÁN LẠI (TƯƠNG TỰ NHƯ Ở TRANG CART)                            */}
        {/* ========================================================================= */}
        <Modal
          title={<span className="text-lg font-bold text-gray-800">Thanh toán Đơn hàng #{paymentOrder?.id}</span>}
          open={isPaymentModalVisible}
          onCancel={() => setIsPaymentModalVisible(false)}
          footer={null}
          centered
          destroyOnClose
        >
          {paymentOrder && (
            <div className='flex flex-col items-center justify-center py-4'>
              <div className='p-6 border border-gray-200 rounded-xl bg-white shadow-sm text-center w-full max-w-sm'>
                <Text className='block mb-2 font-medium text-gray-600'>Tổng tiền cần thanh toán</Text>
                <Text className='block text-3xl font-bold text-[#ee4d2d] mb-6'>
                  ₫{new Intl.NumberFormat('vi-VN').format(paymentOrder.totalAmount)}
                </Text>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex justify-center w-full">
                  <PayPalScriptProvider options={{ 
                    clientId: "AeUy_yLBmbpd2uRXsO9dyn9zCCGzoegIVfbLB7UN1Ze2bxb2QdsDnr4-yvKL4fGgSg_vxp1yard3YvY8", 
                    currency: "USD" 
                  }}>
                    <PayPalPaymentButton 
                      orderId={paymentOrder.id.toString()} 
                      amount={paymentOrder.totalAmount} 
                    />
                  </PayPalScriptProvider>
                </div>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
};
export default OrderHistory;