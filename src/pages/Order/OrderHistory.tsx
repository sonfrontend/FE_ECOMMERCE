import React, { useEffect, useState } from 'react';
import { Typography, List, Tag, Skeleton, message, Card, Flex, Button, Modal, Tabs, Rate, Input, Form, Select, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { Link } from 'react-router-dom';
import { OrderStatus } from '@/contants/OrderStatus.enum';
import OrderTimer from './OrderTimer';
import { getStatusColor, getStatusText } from '@/utils/getStatus';
import { jwtDecode } from 'jwt-decode';
import { getImageUrl } from '@/utils/imageUrl';
const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;


const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // --- STATE KHIẾU NẠI ---
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState<any>(null);
  const [disputeFileList, setDisputeFileList] = useState<UploadFile[]>([]);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeForm] = Form.useForm();
  const [disputeReasons, setDisputeReasons] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // The token usually has nameid or sub claim
        setCurrentUserId(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || '');
      } catch (err) { }
    }
    fetchDisputeReasons();
  }, []);

  const fetchDisputeReasons = async () => {
    try {
      const res = await http.get('/api/Dispute/reasons');
      setDisputeReasons(res.data);
    } catch (error) {
      console.error('Failed to fetch dispute reasons', error);
    }
  };


  // --- STATE QUẢN LÝ ĐÁNH GIÁ SẢN PHẨM ---
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewItem, setReviewItem] = useState<{orderItem: any, order: any} | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!reviewItem) return;
    try {
      setIsSubmittingReview(true);
      await http.post('/api/Review', {
        productId: reviewItem.orderItem.articleId,
        orderItemId: reviewItem.orderItem.id,
        rating: reviewRating,
        comment: reviewComment
      });
      message.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      setIsReviewModalVisible(false);
      setReviewItem(null);
      setReviewRating(5);
      setReviewComment('');
      fetchOrders(); // Refresh to update isReviewed flag
    } catch (error: any) {
      message.error(error?.response?.data || 'Không thể gửi đánh giá lúc này');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

    // Lắng nghe sự kiện có thông báo mới (từ Header bắn sang)
    const handleNotification = (e: any) => {
      // Có thể check thêm e.detail.type nếu chỉ muốn load lại khi type là OrderStatusChanged
      // Ở đây load lại danh sách đơn hàng cho chắc ăn
      fetchOrders();
    };

    window.addEventListener('receive-notification', handleNotification);
    
    return () => {
      window.removeEventListener('receive-notification', handleNotification);
    };
  }, []);


  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case OrderStatus.Pending:
        return order.status === OrderStatus.PendingPayment || order.status === OrderStatus.Pending;
      case OrderStatus.Processing:
        return order.status === OrderStatus.Processing;
      case OrderStatus.Delivered:
        return order.status === OrderStatus.Delivered || order.status === OrderStatus.Shipped;
      case OrderStatus.Completed:
        return order.status === OrderStatus.Completed;
      case OrderStatus.Cancelled:
        return order.status === OrderStatus.Cancelled;
      case OrderStatus.Lost:
        return order.status === OrderStatus.Lost;
      case OrderStatus.Refunded:
        return order.status === OrderStatus.Refunded;
      case OrderStatus.Disputed:
        return order.status === OrderStatus.Disputed;
      default:
        return true;
    }
  });


  const tabItems = [
    { key: 'ALL', label: 'Tất cả' },
    { key: OrderStatus.Pending, label: 'Chờ thanh toán' },
    { key: OrderStatus.Processing, label: 'Vận chuyển' },
    { key: OrderStatus.Delivered, label: 'Chờ giao hàng' },
    { key: OrderStatus.Completed, label: 'Hoàn thành' },
    { key: OrderStatus.Cancelled, label: 'Đã hủy' },
    { key: OrderStatus.Lost, label: 'Mất hàng' },
    { key: OrderStatus.Disputed, label: 'Tranh chấp' },
    { key: OrderStatus.Refunded, label: 'Hoàn tiền' },
  ];

  
  // const filteredOrders = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab);

  const handleDisputeSubmit = async (values: any) => {
    if (!disputeOrder) return;
    try {
      setIsDisputing(true);
      let evidenceUrl = null;

      // Upload image first if exists
      if (disputeFileList.length > 0) {
        const formData = new FormData();
        const fileToUpload = disputeFileList[0].originFileObj as Blob;
        formData.append('file', fileToUpload);
        
        const uploadRes = await http.post('/api/Chat/upload-complaint-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        evidenceUrl = uploadRes.data.imageName;
      }

      // Format the Reason combining dropdown and note
      let finalReason = `Lý do: ${values.reason}`;
      if (values.note) {
        finalReason += `\nGhi chú: ${values.note}`;
      }

      // Call API create complaint
      const res = await http.post('/api/Dispute/complaints', {
        orderId: disputeOrder.id,
        reason: finalReason,
        evidenceUrl: evidenceUrl
      });

      // Thông báo cho Admin
      try {
        await http.post('/api/Notification/notify-admin', {
          actionCode: 'REQUEST_REFUND',
          details: `Đơn hàng #${disputeOrder.id} - Lý do: ${values.reason}`,
          relatedId: disputeOrder.id.toString()
        });
      } catch (err) {
        console.error('Failed to notify admin', err);
      }

      message.success('Gửi yêu cầu khiếu nại thành công! Admin sẽ xử lý sớm.');
      setIsDisputeModalVisible(false);
      setDisputeOrder(null);
      setDisputeFileList([]);
      disputeForm.resetFields();
      fetchOrders();
    } catch (error: any) {
      message.error(error?.response?.data || 'Lỗi khi gửi yêu cầu khiếu nại');
    } finally {
      setIsDisputing(false);
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
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems}
          className="bg-white !px-6 !py-2 !mb-4 shadow-sm rounded-lg"
          tabBarStyle={{ marginBottom: 0 }}
        />

        {filteredOrders.length === 0 ? (
          <div className='bg-white p-16 text-center shadow-sm rounded-lg flex flex-col items-center justify-center'>
            <img src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/orderlist/5fafbb923393b712b96488590b8f781f.png" alt="empty" className="w-28 mb-4 opacity-80" />
            <Text className='text-gray-500 text-lg'>Chưa có đơn hàng</Text>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {filteredOrders.map((order) => (
              <Card key={order.id} id={`order-${order.id}`} className='shadow-sm border border-gray-100 rounded-lg hover:shadow-md transition-shadow' bodyStyle={{ padding: 0 }}>
                <div className='border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-white'>
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
                    
                    <Tag color={getStatusColor(order?.status)} className='text-sm px-3 py-1 m-0'>
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
                              src={getImageUrl(item.imageUrl)}
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
                        <div className='flex flex-col items-end gap-2'>
                          <div className='text-[#ee4d2d] font-medium text-base'>
                            ₫{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}
                          </div>
                          {(order.status === OrderStatus.Completed) && (
                            <Button 
                              type={item.isReviewed ? 'default' : 'primary'}
                              ghost={!item.isReviewed}
                              disabled={item.isReviewed}
                              size="small"
                              onClick={() => {
                                setReviewItem({ orderItem: item, order: order });
                                setIsReviewModalVisible(true);
                              }}
                            >
                              {item.isReviewed ? 'Đã đánh giá' : 'Đánh giá'}
                            </Button>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                </div>

                {/* TỔNG KẾT VÀ NÚT THANH TOÁN NGAY */}
                <div className='bg-rose-50/30 px-6 py-5 flex justify-between items-end'>
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
                    <div className='flex flex-col items-end gap-1'>
                      <Text className='text-gray-500 text-sm'>
                        Phí vận chuyển: ₫{new Intl.NumberFormat('vi-VN').format(order.shippingFee || 0)}
                      </Text>
                      {order.voucherCode && (
                        <Text className='text-green-600 text-sm'>
                          Voucher ({order.voucherCode}): -₫{new Intl.NumberFormat('vi-VN').format(order.discountAmount || 0)}
                        </Text>
                      )}
                      {!order.voucherCode && order.discountAmount > 0 && (
                        <Text className='text-green-600 text-sm'>
                          Giảm giá: -₫{new Intl.NumberFormat('vi-VN').format(order.discountAmount)}
                        </Text>
                      )}
                      <div className='flex items-center gap-4 mt-1'>
                        <Text className='text-base font-medium'>
                          {order.status?.toLowerCase() === 'refunded' 
                            ? 'Số tiền đã hoàn trả:' 
                            : (order.isPaid ? 'Số tiền đã thanh toán:' : 'Tổng số tiền:')}
                        </Text>
                        <Text className='text-[#ee4d2d] text-2xl font-bold'>
                          ₫{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}
                        </Text>
                      </div>
                    </div>

                    {/* 3. NÚT THANH TOÁN NGAY DÀNH CHO ĐƠN HÀNG CÒN HẠN */}
                    {order.status === OrderStatus.PendingPayment && (
                      <Button 
                        type="primary" 
                        size="large"
                        className="bg-[#ee4d2d] hover:bg-[#f05d40] border-none px-8 font-medium"
                        onClick={async () => {
                          try {
                            const res = await http.post('/api/Payment/vnpay-create', { InternalOrderId: order.id });
                            if (res.data.url) {
                              window.location.href = res.data.url;
                            } else {
                              message.error('Không lấy được link thanh toán');
                            }
                          } catch (error) {
                            message.error('Lỗi khởi tạo thanh toán VNPAY');
                          }
                        }}
                      >
                        Thanh toán ngay
                      </Button>
                    )}

                    {/* NÚT HỦY ĐƠN */}
                    {(order.status === OrderStatus.Pending || order.status === OrderStatus.PendingPayment) && (
                      <Button 
                        danger
                        size="large"
                        className="px-8 font-medium"
                        onClick={() => {
                          Modal.confirm({
                            title: 'Xác nhận hủy đơn',
                            content: order.isPaid ? 'Đơn hàng đã thanh toán. Bạn có chắc muốn hủy? Tiền sẽ được hoàn lại.' : 'Bạn có chắc chắn muốn hủy đơn hàng này?',
                            okText: 'Đồng ý hủy',
                            cancelText: 'Quay lại',
                            onOk: async () => {
                              try {
                                const res = await http.put(`/api/Order/${order.id}/cancel`);
                                message.success(res?.data?.message || 'Đã hủy đơn hàng');
                                fetchOrders();
                              } catch (error: any) {
                                message.error(error?.response?.data || 'Có lỗi xảy ra');
                              }
                            }
                          });
                        }}
                      >
                        Hủy đơn hàng
                      </Button>
                    )}

                    {/* NÚT ĐÃ NHẬN HÀNG VÀ HOÀN TIỀN */}
                    {order.status === OrderStatus.Delivered && (
                      <div className="flex gap-3">
                        <Button 
                          danger
                          size="large"
                          onClick={() => {
                            setDisputeOrder(order);
                            setIsDisputeModalVisible(true);
                          }}
                        >
                          Yêu cầu Đổi trả / Khiếu nại
                        </Button>
                        <Button 
                          type="primary" 
                          size="large"
                          className="bg-[#ee4d2d] hover:bg-[#f05d40] border-none px-8 font-medium"
                          onClick={() => {
                            Modal.confirm({
                              title: 'Xác nhận đã nhận hàng',
                              content: 'Bạn xác nhận đã nhận được hàng và hàng hóa không có vấn đề gì?',
                              okText: 'Đã nhận',
                              cancelText: 'Hủy',
                              onOk: async () => {
                                try {
                                  const res = await http.put(`/api/Order/${order.id}/confirm-received`);
                                  message.success(res?.data?.message || 'Cảm ơn bạn đã mua sắm!');
                                  
                                  try {
                                    await http.post('/api/Notification/notify-admin', {
                                      actionCode: 'COMPLETE_ORDER',
                                      details: `Đơn hàng #${order.id} đã được người mua xác nhận hoàn thành.`,
                                      relatedId: order.id.toString()
                                    });
                                  } catch (err) {
                                    console.error('Failed to notify admin', err);
                                  }

                                  fetchOrders();
                                } catch (error: any) {
                                  message.error(error?.response?.data || 'Có lỗi xảy ra');
                                }
                              }
                            });
                          }}
                        >
                          Đã nhận được hàng
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* HIỂN THỊ KHUNG CHAT HOẶC LỊCH SỬ TRANH CHẤP */}
                {(order.status === OrderStatus.Disputed || order.status === OrderStatus.PendingResolution || order.complaintReason) && (
                  <div className='px-6 py-4 bg-gray-50 border-t relative'>
                    <h4 className='font-bold mb-3 flex items-center gap-3'>
                      Thông tin khiếu nại / tranh chấp
                      {order.status !== OrderStatus.Disputed && order.status !== OrderStatus.PendingResolution ? (
                        <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">Đã giải quyết xong</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">Đang giải quyết</span>
                      )}
                    </h4>
                    
                    {/* User's Complaint Info */}
                    {(order.complaintReason || order.complaintEvidenceUrl) && (
                      <div className='mb-4 p-4 bg-white border border-gray-200 rounded text-gray-800'>
                        <span className='font-semibold text-gray-900'>Lý do bạn khiếu nại:</span>
                        <p className='mt-1 whitespace-pre-wrap'>{order.complaintReason}</p>
                        {order.complaintEvidenceUrl && (
                          <div className="mt-3">
                            <strong>Bằng chứng đính kèm:</strong><br/>
                            <img src={getImageUrl(order.complaintEvidenceUrl)} alt="Bằng chứng của bạn" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4, objectFit: 'cover', marginTop: 8 }} />
                          </div>
                        )}
                      </div>
                    )}

                    {order.resolutionTemplateTitle && (
                      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                        <h4 className='font-bold text-yellow-800 mb-3'>Quyết định giải quyết từ Quản trị viên:</h4>
                        <div className='bg-white p-3 rounded border border-yellow-100 text-gray-800'>
                          <p className='font-semibold text-gray-900 mb-1'>Hướng giải quyết: {order.resolutionTemplateTitle}</p>
                          {order.resolutionTemplateDescription && (
                            <p className='mt-1 text-sm italic text-gray-600'>{order.resolutionTemplateDescription}</p>
                          )}
                          {order.requiresRefund && (
                            <p className="mt-1 text-sm">
                              <strong>Hoàn tiền:</strong> {order.isFullRefund ? 'Hoàn toàn bộ' : `Hoàn một phần (${order.refundAmount ? order.refundAmount.toLocaleString('vi-VN') : 0} VNĐ)`}
                              <br/>
                              <strong>Phương thức:</strong> {order.resolutionPaymentMethod === 'VNPAY' ? 'Hoàn qua VNPAY' : 'Thỏa thuận ngoài (COD/Chuyển khoản)'}
                            </p>
                          )}
                          {order.resolutionNote && (
                            <p className='mt-1 text-sm text-gray-700'><strong>Ghi chú thêm:</strong> {order.resolutionNote}</p>
                          )}
                          {order.adminEvidenceUrl && (
                            <div className="mt-3">
                              <strong>Bằng chứng đính kèm:</strong><br/>
                              <img src={getImageUrl(order.adminEvidenceUrl)} alt="Bằng chứng từ quản trị viên" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 4, objectFit: 'cover', marginTop: 8 }} />
                            </div>
                          )}
                        </div>
                        {order.status === OrderStatus.PendingResolution && (
                          <div className='flex gap-3 mt-4'>
                            <Button 
                              type='primary' 
                              className='bg-green-600 hover:bg-green-700 border-none'
                              onClick={async () => {
                                try {
                                  await http.post(`/api/Dispute/order/${order.id}/reply-resolution`, { accept: true });
                                  await http.post('/api/Notification/notify-admin', {
                                    actionCode: 'ACCEPT_DISPUTE',
                                    details: `Đơn hàng #${order.id}`,
                                    relatedId: order.id.toString()
                                  });
                                  message.success('Bạn đã đồng ý với phương án giải quyết');
                                  fetchOrders();
                                } catch(e) {
                                  message.error('Lỗi khi phản hồi');
                                }
                              }}
                            >
                              Đồng ý & Đóng khiếu nại
                            </Button>
                            <Button 
                              danger 
                              onClick={async () => {
                                try {
                                  await http.post(`/api/Dispute/order/${order.id}/reply-resolution`, { accept: false });
                                  await http.post('/api/Notification/notify-admin', {
                                    actionCode: 'REJECT_DISPUTE',
                                    details: `Đơn hàng #${order.id}`,
                                    relatedId: order.id.toString()
                                  });
                                  message.success('Bạn không đồng ý. Tiếp tục khiếu nại.');
                                  fetchOrders();
                                } catch(e) {
                                  message.error('Lỗi khi gửi từ chối');
                                }
                              }}
                            >
                              Không đồng ý (Tiếp tục khiếu nại)
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}


        {/* ========================================================================= */}
        {/* MODAL ĐÁNH GIÁ SẢN PHẨM                                                   */}
        {/* ========================================================================= */}
        <Modal
          title={<span className="text-lg font-bold text-gray-800">Đánh giá sản phẩm</span>}
          open={isReviewModalVisible}
          onCancel={() => {
            setIsReviewModalVisible(false);
            setReviewItem(null);
            setReviewRating(5);
            setReviewComment('');
          }}
          onOk={handleSubmitReview}
          okText="Gửi đánh giá"
          cancelText="Hủy"
          confirmLoading={isSubmittingReview}
          centered
          destroyOnClose
        >
          {reviewItem && (
            <div className='flex flex-col gap-4 py-4'>
              <div className='flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100'>
                <img
                  src={getImageUrl(reviewItem.orderItem.imageUrl)}
                  className='w-16 h-16 object-cover rounded-md border border-gray-200'
                  alt='product'
                />
                <div>
                  <Text className='font-medium text-base block'>{reviewItem.orderItem.productName}</Text>
                  <Text className='text-gray-500 text-sm'>Phân loại: {reviewItem.orderItem.color}, {reviewItem.orderItem.size}</Text>
                </div>
              </div>

              <div className='flex flex-col items-center gap-2 mt-2'>
                <Text className='font-medium'>Chất lượng sản phẩm</Text>
                <Rate 
                  className='text-3xl text-[#ee4d2d]' 
                  value={reviewRating} 
                  onChange={setReviewRating} 
                />
              </div>

              <div className='mt-2'>
                <Text className='font-medium mb-2 block'>Nhận xét của bạn</Text>
                <TextArea
                  rows={4}
                  placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này nhé..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  maxLength={1000}
                />
              </div>
            </div>
          )}
        </Modal>

      {/* MODAL KHIẾU NẠI ĐƠN HÀNG */}
      <Modal
        title="Yêu cầu Đổi trả / Khiếu nại"
        open={isDisputeModalVisible}
        onCancel={() => {
          setIsDisputeModalVisible(false);
          setDisputeOrder(null);
          disputeForm.resetFields();
          setDisputeFileList([]);
        }}
        confirmLoading={isDisputing}
        onOk={() => disputeForm.submit()}
        okText="Gửi khiếu nại"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Form form={disputeForm} layout="vertical" onFinish={handleDisputeSubmit}>
          <Form.Item 
            label="Lý do khiếu nại" 
            name="reason" 
            rules={[{ required: true, message: 'Vui lòng chọn lý do khiếu nại' }]}
          >
            <Select placeholder="Chọn lý do...">
              {disputeReasons.map(reason => (
                <Select.Option key={reason.id} value={reason.title}>
                  {reason.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Ghi chú thêm (Tuỳ chọn)" name="note">
            <TextArea rows={4} placeholder="Nhập chi tiết tình trạng gặp phải..." />
          </Form.Item>

          <Form.Item label="Hình ảnh bằng chứng (Khuyên dùng)">
            <Upload
              listType="picture-card"
              fileList={disputeFileList}
              onChange={({ fileList }) => setDisputeFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
            >
              {disputeFileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      </div>
    </div>
  );
};
export default OrderHistory;