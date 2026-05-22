import React, { useEffect, useState } from 'react';
import { Table, Select, message, Typography } from 'antd';
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

  const statusOptions = ['Đang chờ xử lý', 'Đã duyệt', 'Đang giao', 'Đã giao', 'Đã hủy'];

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
        <Select value={record.status} style={{ width: 150 }} onChange={(val) => handleStatusChange(record.id, val)}>
          {statusOptions.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Select>
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
