import React, { useEffect, useState } from 'react';
import { Table, Select, message, Typography, Button, Space, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import http from '@/apis/http';

const { Title } = Typography;
const { Option } = Select;

const OrderManage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const getStatusText = (status: string, paymentMethod: string) => {
    switch(status) {
      case 'PendingPayment': return 'Đã đặt mà chưa thanh toán';
      case 'Pending': return paymentMethod === 'COD' ? 'Đã đặt' : 'Đã đặt và thanh toán rồi';
      case 'Processing': return 'Nhận đơn và chuẩn bị đồ để giao';
      case 'Shipped': return 'Đang giao';
      case 'Completed': return paymentMethod === 'COD' ? 'Đã nhận và thanh toán - hoàn thành' : 'Đã nhận - hoàn thành';
      case 'Cancelled': return 'Đã hủy';
      case 'Refunded': return 'Hoàn tiền';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PendingPayment': return 'orange';
      case 'Pending': return 'gold';
      case 'Processing': return 'blue';
      case 'Shipped': return 'cyan';
      case 'Completed': return 'green';
      case 'Cancelled': return 'red';
      case 'Refunded': return 'magenta';
      default: return 'default';
    }
  }

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
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          <Tag color={getStatusColor(record.status)}>{getStatusText(record.status, record.paymentMethod)}</Tag>
          
          <Select value={record.status} style={{ width: 250 }} onChange={(val) => handleStatusChange(record.id, val)}>
            {statusOptions.map((s) => (
              <Option key={s} value={s}>
                {getStatusText(s, record.paymentMethod)}
              </Option>
            ))}
          </Select>

          {record.status === 'Pending' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />} 
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleStatusChange(record.id, 'Processing')}
            >
              Duyệt đơn
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <Title level={3} className='mb-6'>
        Quản lý Đơn Hàng
      </Title>
      <Table
        dataSource={orders}
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
            </div>
          )
        }}
      />
    </div>
  );
};

export default OrderManage;
