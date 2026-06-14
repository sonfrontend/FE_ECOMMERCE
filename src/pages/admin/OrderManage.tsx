import React, { useEffect, useState } from 'react';
import { Table, message, Typography, Button, Space, Tag, Tabs, Select, Modal, Input } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { getStatusColor, getStatusText } from '@/utils/getStatus';
import { jwtDecode } from 'jwt-decode';
const { Title } = Typography;
const { Option } = Select;

const OrderManage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const [isProposeModalVisible, setIsProposeModalVisible] = useState(false);
  const [proposingOrderId, setProposingOrderId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

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
  }, []);

  const handleProposeResolution = async () => {
    if (!proposingOrderId || !selectedTemplate) {
      message.error('Vui lòng chọn mẫu lý do');
      return;
    }
    try {
      await http.post(`/api/dispute/${proposingOrderId}/propose-resolution`, {
        templateId: selectedTemplate,
        note: resolutionNote
      });
      message.success('Đã đưa ra đề xuất giải quyết');
      setIsProposeModalVisible(false);
      setProposingOrderId(null);
      setSelectedTemplate(null);
      setResolutionNote('');
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

  const statusOptions = ['PendingPayment', 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled', 'Refunded'];



  const getNextStatusAction = (status: string) => {
    switch(status) {
      case 'PendingPayment': return { next: 'Pending', label: 'Xác nhận đã thanh toán', color: '#faad14' };
      case 'Pending': return { next: 'Processing', label: 'Duyệt đơn', color: '#1890ff' };
      case 'Processing': return { next: 'Shipped', label: 'Giao hàng', color: '#13c2c2' };
      case 'Shipped': return { next: 'Delivered', label: 'Đã giao', color: '#52c41a' };
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

              {(record.status === 'Disputed') && (
              <Button 
                type="primary"
                size="small" 
                onClick={() => {
                  setProposingOrderId(record.id);
                  setIsProposeModalVisible(true);
                }}
              >
                Đưa ra quyết định giải quyết
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
    { key: 'All', label: 'Tất cả' },
    { key: 'Pending', label: 'Chờ xác nhận' },
    { key: 'Processing', label: 'Đang chuẩn bị' },
    { key: 'Shipped', label: 'Đang giao' },
    { key: 'Delivered', label: 'Đã giao' },
    { key: 'Completed', label: 'Hoàn thành' },
    { key: 'Cancelled', label: 'Đã hủy' },
    { key: 'Disputed', label: 'Đã hoàn tiền/Tranh chấp' },
  ];

  const filteredOrders = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab);

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
              <ul className='list-disc pl-5 mt-2'>
                {record.orderItems.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.productName} ({item.color}, {item.size}) - SL: {item.quantity} - Giá: ₫
                    {new Intl.NumberFormat('vi-VN').format(item.unitPrice)}
                  </li>
                ))}
              </ul>
              
              {(record.status === 'Disputed' || record.status === 'PendingResolution') && (
                <div className='mt-4 p-4 bg-white border border-gray-200 rounded-lg'>
                  <h4 className='font-bold mb-2'>Thảo luận giải quyết tranh chấp</h4>
                  {record.status === 'PendingResolution' && (
                    <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded'>
                      <span className='font-semibold'>Quyết định đã đưa ra:</span>
                      <p className='mt-1 text-gray-900 font-medium'>{record.resolutionTemplateTitle}</p>
                      {record.resolutionNote && <p className='mt-1 text-gray-700'>Ghi chú: {record.resolutionNote}</p>}
                      <small className='text-gray-500'>Đang chờ người dùng xác nhận. Sẽ tự động hoàn tất sau 3 ngày.</small>
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
              <span>{templates.find(t => t.id === selectedTemplate)?.handlingMethod}</span>
            </div>
          )}
        </div>
        
        <div>
          <label className="block mb-2 font-medium">Ghi chú thêm (Tùy chọn)</label>
          <Input.TextArea 
            rows={4} 
            value={resolutionNote} 
            onChange={e => setResolutionNote(e.target.value)} 
            placeholder="Ghi chú chi tiết thêm cho người dùng hiểu..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default OrderManage;
