import React, { useEffect, useState } from 'react';
import { Table, message, Typography, Button, Space, Tag, Tabs, Select, Modal, Input, Checkbox, InputNumber, Radio, Upload } from 'antd';
import { CheckCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import http from '@/apis/http';
import { getStatusColor, getStatusText } from '@/utils/getStatus';
import { getImageUrl } from '@/utils/imageUrl';
import { jwtDecode } from 'jwt-decode';
import { getOrderStatusList, OrderStatus } from '@/contants/OrderStatus.enum';
const { Title } = Typography;
const { Option } = Select;


const OrderManage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [expandedRowKeys, setExpandedRowKeys] = useState<readonly React.Key[]>([]);
  const location = useLocation();
  
  const [isProposeModalVisible, setIsProposeModalVisible] = useState(false);
  const [proposingOrderId, setProposingOrderId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [currentComplaint, setCurrentComplaint] = useState<any>(null);

  const [restoresInventory, setRestoresInventory] = useState(false);
  const [isFullRefund, setIsFullRefund] = useState(false);
  const [requiresRefund, setRequiresRefund] = useState(false);
  const [refundPaymentMethod, setRefundPaymentMethod] = useState<string>('COD');
  const [originalPaymentMethod, setOriginalPaymentMethod] = useState<string>('COD');
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [adminEvidenceUrl, setAdminEvidenceUrl] = useState('');
  const [finalOrderStatus, setFinalOrderStatus] = useState<string>('');

  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        setRestoresInventory(template.restoresInventory);
        setIsFullRefund(template.isFullRefund);
        setRequiresRefund(template.requiresRefund);
      }
    }
  }, [selectedTemplate, templates]);


  const fetchOrders = async () => {
    try {
      const res = await http.get('/api/Order/admin');
      setOrders(res.data);
    } catch (error) {
      message.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await http.get('/api/dispute/resolution-templates');
      setTemplates(res.data);
    } catch (error) {
      console.log('Error fetching templates', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTemplates();
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUserId(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || '');
      } catch (err) { }
    }

    const handleNotification = (e: any) => {
      fetchOrders();
    };

    window.addEventListener('admin-receive-notification', handleNotification);

    return () => {
      window.removeEventListener('admin-receive-notification', handleNotification);
    };
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).highlightOrderId) {
      const orderId = Number((location.state as any).highlightOrderId);
      if (orderId && !expandedRowKeys.includes(orderId)) {
        setExpandedRowKeys(prev => [...prev, orderId]);
      }
    }
    
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  const handleProposeResolution = async () => {
    if (!currentComplaint || !selectedTemplate) {
      message.error('Vui lòng chọn mẫu lý do');
      return;
    }
    try {
      await http.post(`/api/Dispute/complaints/${currentComplaint.id}/propose-resolution`, {
        handlingMethodId: selectedTemplate,
        adminNote: resolutionNote,
        adminEvidenceUrl: adminEvidenceUrl,
        restoresInventory: restoresInventory,
        isFullRefund: isFullRefund,
        requiresRefund: requiresRefund,
        refundAmount: (requiresRefund && !isFullRefund) ? refundAmount : null,
        paymentMethod: refundPaymentMethod,
        finalOrderStatus: finalOrderStatus || null
      });
      message.success('Đã lưu quyết định xử lý và cập nhật trạng thái');
      setIsProposeModalVisible(false);
      setProposingOrderId(null);
      setSelectedTemplate(null);
      setResolutionNote('');
      setAdminEvidenceUrl('');
      setRefundAmount(null);
      setFinalOrderStatus('');
      setCurrentComplaint(null);
      fetchOrders();
    } catch (error: any) {
      message.error('Lỗi: ' + error?.response?.data);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await http.put(`/api/Order/admin/${orderId}/status`, { status: newStatus });
      message.success('Đã cập nhật trạng thái đơn hàng');
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (error) {
      message.error(error);
    }
  };


  const getNextStatusAction = (status: string) => {
    switch(status) {
      case OrderStatus.PendingPayment: return { next: OrderStatus.Pending, label: 'Xác nhận đã thanh toán', color: '#faad14' };
      case OrderStatus.Pending: return { next: OrderStatus.Processing, label: 'Duyệt đơn', color: '#1890ff' };
      case OrderStatus.Processing: return { next: OrderStatus.Shipped, label: 'Giao hàng', color: '#13c2c2' };
      case OrderStatus.Shipped: return { next: OrderStatus.Delivered, label: 'Đã giao', color: '#52c41a' };
      default: return null;
    }
  };

  const columns = [
    {
      title: 'Mã ĐH',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: any, record: any) => (
        <div>
          <div>
            <b>{record.recipientName}</b>
          </div>
          <div>{record.phoneNumber}</div>
        </div>
      )
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <span className='text-[#ee4d2d] font-bold'>₫{new Intl.NumberFormat('vi-VN').format(amount)}</span>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        return (
          <Space direction="vertical" size="small">
            <Tag color={getStatusColor(record.status)}>{getStatusText(record.status, record.paymentMethod)}</Tag>
          </Space>
        )
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => {
        const action = getNextStatusAction(record.status);
        return (
          <Space direction="vertical" size="small">
            {action && (
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckCircleOutlined />} 
                style={{ background: action.color, borderColor: action.color }}
                onClick={() => handleStatusChange(record.id, action.next)}
              >
                {action.label}
              </Button>
            )}

            {(record.status === 'PendingPayment' || record.status === 'Pending') && (
              <Button 
                danger
                size="small" 
                type="text"
                onClick={() => handleStatusChange(record.id, 'Cancelled')}
              >
                Hủy đơn
              </Button>
            )}

              {record.status === 'Disputed' && (
                <Button size="small" danger onClick={async () => {
                  try {
                    const res = await http.get(`/api/Dispute/order/${record.id}/complaint`);
                    setCurrentComplaint(res.data);
                    setProposingOrderId(record.id);
                    const originalPayment = record.paymentMethod || 'COD';
                    setOriginalPaymentMethod(originalPayment);
                    setRefundPaymentMethod(originalPayment === 'VNPAY' ? 'VNPAY' : 'COD');
                    setIsProposeModalVisible(true);
                  } catch (err: any) {
                    message.error(err?.response?.data || 'Không tìm thấy thông tin khiếu nại');
                  }
                }}>
                  Xử lý Khiếu nại
                </Button>
              )}
            
            {(record.status === 'PendingResolution') && (
              <Tag color="orange" className='m-0'>Chờ User xác nhận</Tag>
            )}
            
          </Space>
        )
      }
    }
  ];

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

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <Title level={3} className='mb-4'>
        Quản lý Đơn Hàng
      </Title>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems}
        className="mb-4"
      />

      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey='id'
        loading={loading}
        expandable={{
          expandedRowKeys: expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
          expandedRowRender: (record) => (
            <div className='p-4 bg-gray-50'>
              <p>
                <b>Địa chỉ:</b> {record.shippingAddress}
              </p>
              <p>
                <b>Thanh toán:</b>{' '}
                {record.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản (Mã QR)'}
                {' - '}
                {record.isPaid ? (
                  <Tag color="green" className="m-0 border-none px-2 rounded-md">Đã thanh toán</Tag>
                ) : (
                  <Tag color="volcano" className="m-0 border-none px-2 rounded-md">Chưa thanh toán</Tag>
                )}
              </p>
              <div className='mt-3 space-y-3'>
                {record.orderItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <img 
                      src={getImageUrl(item.imageUrl)} 
                      alt={item.productName} 
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.productName}</div>
                      <div className="text-sm text-gray-500">Phân loại: {item.color}, {item.size}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">x{item.quantity}</div>
                      <div className="font-medium text-red-600">
                        ₫{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {(record.status === 'Disputed' || record.status === 'PendingResolution' || record.complaintReason) && (
                <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg relative'>
                  <h4 className='font-bold mb-3 flex items-center gap-3'>
                    Thông tin khiếu nại / tranh chấp
                    {record.status !== 'Disputed' && record.status !== 'PendingResolution' ? (
                      <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">Đã giải quyết xong</span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">Đang giải quyết</span>
                    )}
                  </h4>
                  
                  {/* User's Complaint Info */}
                  {(record.complaintReason || record.complaintEvidenceUrl) && (
                    <div className='mb-4 p-4 bg-white border border-gray-200 rounded text-gray-800'>
                      <span className='font-semibold text-gray-900'>Lý do khách khiếu nại:</span>
                      <p className='mt-1 whitespace-pre-wrap'>{record.complaintReason}</p>
                      {record.complaintEvidenceUrl && (
                        <div className="mt-3">
                          <strong>Bằng chứng của khách:</strong><br/>
                          <img src={getImageUrl(record.complaintEvidenceUrl)} alt="Bằng chứng của khách" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4, objectFit: 'cover', marginTop: 8 }} />
                        </div>
                      )}
                    </div>
                  )}

                  {record.resolutionTemplateTitle && (
                    <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                      <h4 className='font-bold text-yellow-800 mb-3'>Quyết định đã đưa ra:</h4>
                      <div className='bg-white p-3 rounded border border-yellow-100 text-gray-800'>
                        <p className='font-semibold text-gray-900 mb-1'>Hướng giải quyết: {record.resolutionTemplateTitle}</p>
                        {record.resolutionTemplateDescription && (
                          <p className='mt-1 text-sm italic text-gray-600'>{record.resolutionTemplateDescription}</p>
                        )}
                        {record.requiresRefund && (
                          <p className="mt-1 text-sm">
                            <strong>Hoàn tiền:</strong> {record.isFullRefund ? 'Hoàn toàn bộ' : `Hoàn một phần (${record.refundAmount ? record.refundAmount.toLocaleString('vi-VN') : 0} VNĐ)`}
                            <br/>
                            <strong>Phương thức:</strong> {record.resolutionPaymentMethod === 'VNPAY' ? 'Hoàn qua VNPAY' : 'Thỏa thuận ngoài (COD/Chuyển khoản)'}
                          </p>
                        )}
                        {record.restoresInventory && <p className="mt-1 text-sm text-blue-600">Lưu ý: Yêu cầu khách gửi trả sản phẩm.</p>}
                        {record.finalOrderStatus && <p className="mt-1 text-sm text-purple-600"><strong>Trạng thái sau xử lý:</strong> {getStatusText(record.finalOrderStatus)}</p>}
                        {record.resolutionNote && <p className='mt-1 text-sm text-gray-700'><strong>Ghi chú:</strong> {record.resolutionNote}</p>}
                        {record.adminEvidenceUrl && (
                          <div className="mt-3">
                            <strong>Bằng chứng đính kèm:</strong><br/>
                            <img src={getImageUrl(record.adminEvidenceUrl)} alt="Bằng chứng Admin" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4, objectFit: 'cover', marginTop: 8 }} />
                          </div>
                        )}
                      </div>
                      {record.status === 'PendingResolution' && (
                        <p className='mt-3 text-sm text-gray-500'>Đang chờ người dùng xác nhận. Sẽ tự động hoàn tất sau 3 ngày.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        }}
      />
      
      <Modal
        title="Đưa ra quyết định giải quyết tranh chấp"
        open={isProposeModalVisible}
        onCancel={() => setIsProposeModalVisible(false)}
        onOk={handleProposeResolution}
        okText="Gửi đề xuất"
        cancelText="Hủy"
      >
        <div className="h-[600px] overflow-y-auto px-2 py-4">
          {currentComplaint && (
          <div className="mb-4 p-4 bg-gray-50 border rounded">
            <div className="mb-2"><strong>Lý do của khách hàng:</strong> <br/> {currentComplaint.reason}</div>
            {currentComplaint.evidenceUrl && (
              <div className="mt-2">
                <strong>Bằng chứng:</strong> <br/>
                <img src={getImageUrl(currentComplaint.evidenceUrl)} alt="Bằng chứng" style={{ maxWidth: 100, maxHeight: 100, marginTop: 8, borderRadius: 4 }} />
              </div>
            )}
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Chọn lý do giải quyết <span className="text-red-500">*</span></label>
          <Select 
            style={{ width: '100%' }} 
            placeholder="-- Chọn lý do --"
            value={selectedTemplate}
            onChange={setSelectedTemplate}
          >
            {templates.map(t => (
              <Option key={t.id} value={t.id}>{t.title}</Option>
            ))}
          </Select>
          
          {selectedTemplate && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded">
              <span className="font-semibold block mb-1">Cách xử lý hệ thống đề xuất:</span>
              <span>{templates.find(t => t.id === selectedTemplate)?.description}</span>
            </div>
          )}
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Ghi chú thêm (Tùy chọn)</label>
          <Input.TextArea 
            rows={3} 
            value={resolutionNote} 
            onChange={e => setResolutionNote(e.target.value)} 
            placeholder="Ghi chú chi tiết thêm cho người dùng hiểu..."
          />
        </div>

        {templates.find(t => t.id === selectedTemplate)?.code === 'OTHER' && (
          <div className="mt-4">
            <label className="block mb-2 font-medium">Chọn Trạng thái cuối cùng của đơn hàng <span className="text-red-500">*</span></label>
            <Select 
              style={{ width: '100%' }} 
              placeholder="-- Chọn trạng thái đơn hàng --"
              value={finalOrderStatus}
              onChange={setFinalOrderStatus}
            >
              {getOrderStatusList()?.map(status => (
                <Option key={status} value={status}>{getStatusText(status)}</Option>
              ))}
            </Select>
          </div>
        )}
        
        <div className="mt-4 p-3 border rounded bg-white">
          <h4 className="font-semibold mb-2">Chi tiết giải quyết</h4>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox checked={requiresRefund} onChange={e => setRequiresRefund(e.target.checked)}>Có hoàn tiền</Checkbox>
            {requiresRefund && (
               <Checkbox checked={isFullRefund} onChange={e => setIsFullRefund(e.target.checked)} className="ml-6">Hoàn tiền toàn bộ</Checkbox>
            )}
            {requiresRefund && !isFullRefund && (
              <div className="ml-6 mt-2">
                 <label className="block mb-1 font-medium">Số tiền hoàn (VNĐ)</label>
                 <InputNumber style={{width: '100%'}} value={refundAmount} onChange={(val) => setRefundAmount(val)} />
              </div>
            )}
            
            <Checkbox checked={restoresInventory} onChange={e => setRestoresInventory(e.target.checked)}>Ghi nhận lại tồn kho (Hoàn trả sản phẩm)</Checkbox>
            
            {requiresRefund && (
                <div className="mt-2">
                  <label className="block mb-1 font-medium">Phương thức hoàn tiền</label>
                  <Radio.Group value={refundPaymentMethod} onChange={e => setRefundPaymentMethod(e.target.value)}>
                    <Radio value="VNPAY" disabled={originalPaymentMethod !== 'VNPAY'}>Hoàn qua VNPay</Radio>
                    <Radio value="COD">Thỏa thuận ngoài (Chuyển khoản / Tiền mặt)</Radio>
                  </Radio.Group>
                  {originalPaymentMethod !== 'VNPAY' && (
                    <div className="text-xs text-orange-500 mt-1">Đơn hàng thanh toán COD (tiền mặt) không thể hoàn tiền qua VNPay.</div>
                  )}
                </div>
              )}

            <div className="mt-2">
              <label className="block mb-1 font-medium">Hình ảnh minh họa (nếu có)</label>
              <div className="flex flex-col gap-2">
                <Upload
                  showUploadList={false}
                  customRequest={async (options) => {
                    const { file, onSuccess, onError } = options;
                    const formData = new FormData();
                    formData.append('file', file as Blob);
                    try {
                      message.loading({ content: 'Đang tải ảnh lên...', key: 'upload' });
                      const res = await http.post('/api/Chat/upload-complaint-image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      setAdminEvidenceUrl(res.data.imageName);
                      message.success({ content: 'Tải ảnh lên thành công!', key: 'upload' });
                      onSuccess?.("ok");
                    } catch (err) {
                      message.error({ content: 'Lỗi tải ảnh', key: 'upload' });
                      onError?.(new Error("Upload failed"));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                </Upload>
                {adminEvidenceUrl && (
                  <div className="mt-2">
                    <img src={getImageUrl(adminEvidenceUrl)} alt="Bằng chứng Admin" style={{ maxWidth: 100, maxHeight: 100, borderRadius: 4, objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
          </Space>
        </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderManage;
