import React, { useEffect, useState } from 'react';
import { Table, Select, message, Typography, Button, Space, Tag, Input, Modal } from 'antd';
import { CheckCircleOutlined, SearchOutlined, DollarOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { PaymentMethod } from '@/contants/PaymentMethod.enum';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminPaymentManage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Order/admin');
      
      // Chỉ lấy các đơn hàng thanh toán online (VNPAY)
      const paymentOrders = res.data.filter((o: any) => 
        o.paymentMethod === PaymentMethod.VNPAY
      );
      
      setOrders(paymentOrders);
    } catch (error) {
      message.error('Lỗi khi tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprovePayment = async (orderId: number) => {
    Modal.confirm({
      title: 'Xác nhận nhận tiền',
      content: `Bạn xác nhận đã nhận được tiền cho đơn hàng #${orderId}? Thao tác này sẽ chuyển trạng thái đơn hàng sang "Đã đặt và thanh toán rồi" (Chờ giao hàng).`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await http.put(`/api/Order/admin/${orderId}/approve-payment`);
          message.success('Xác nhận thanh toán thành công!');
          fetchOrders(); // Tải lại danh sách
        } catch (error: any) {
          message.error(error.response?.data || 'Lỗi khi xác nhận thanh toán');
        }
      }
    });
  };

  const getStatusText = (status: string, isPaid: boolean) => {
    if (isPaid) return 'Đã thanh toán';
    if (status === 'PendingPayment') return 'Chờ nhận tiền';
    if (status === 'Cancelled') return 'Đã hủy';
    return status;
  };

  const getStatusColor = (status: string, isPaid: boolean) => {
    if (isPaid) return 'green';
    if (status === 'PendingPayment') return 'orange';
    if (status === 'Cancelled') return 'red';
    return 'default';
  }

  const filteredOrders = orders.filter((o) => {
    const matchSearch = 
      o.id.toString().includes(searchText) || 
      o.recipientName.toLowerCase().includes(searchText.toLowerCase()) ||
      o.phoneNumber.includes(searchText);
      
    const matchMethod = filterMethod === 'All' || o.paymentMethod === filterMethod;
    
    let matchStatus = true;
    if (filterStatus === 'Paid') matchStatus = o.isPaid === true;
    else if (filterStatus === 'Pending') matchStatus = o.isPaid === false && o.status === 'PendingPayment';
    
    return matchSearch && matchMethod && matchStatus;
  });

  const columns = [
    {
      title: 'Mã ĐH',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <b>#{id}</b>
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: any, record: any) => (
        <div>
          <div><b>{record.recipientName}</b></div>
          <div className="text-gray-500">{record.phoneNumber}</div>
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
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        let color = 'purple';
        let label = 'Không xác định';
        if (method === PaymentMethod.VNPAY) { color = 'geekblue'; label = 'VNPAY'; }
        
        return (
          <Tag color={color}>
            {label}
          </Tag>
        );
      }
    },
    {
      title: 'Số tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <span className='text-[#ee4d2d] font-bold text-base'>
          ₫{new Intl.NumberFormat('vi-VN').format(amount)}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={getStatusColor(record.status, record.isPaid)}>
          {getStatusText(record.status, record.isPaid)}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space direction="vertical" size="small">
          {!record.isPaid && record.status === 'PendingPayment' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<DollarOutlined />} 
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleApprovePayment(record.id)}
            >
              Xác nhận nhận tiền
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <Title level={3} className='mb-6'>
        Quản lý Thanh toán
      </Title>
      
      <div className="flex gap-4 mb-6 flex-wrap">
        <Input 
          placeholder="Tìm theo Mã ĐH, Tên, SĐT" 
          prefix={<SearchOutlined />} 
          className="w-64"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        
        <Select 
          value={filterMethod} 
          onChange={setFilterMethod} 
          className="w-48"
          placeholder="Phương thức thanh toán"
        >
          <Option value="All">Tất cả phương thức</Option>
          <Option value={PaymentMethod.VNPAY}>VNPAY</Option>
        </Select>

        <Select 
          value={filterStatus} 
          onChange={setFilterStatus} 
          className="w-48"
          placeholder="Trạng thái thanh toán"
        >
          <Option value="All">Tất cả trạng thái</Option>
          <Option value="Pending">Chờ nhận tiền</Option>
          <Option value="Paid">Đã thanh toán</Option>
        </Select>
      </div>

      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey='id'
        loading={loading}
        expandable={{
          expandedRowRender: (record) => (
            <div className='p-4 bg-gray-50'>
              <p>
                <b>Địa chỉ nhận hàng:</b> {record.shippingAddress}
              </p>
              <p>
                <b>Chi tiết sản phẩm:</b>
                <ul className="mt-2">
                  {record.orderItems.map((item: any, index: number) => (
                    <li key={index} className="ml-4 list-disc">
                      {item.productName} (Màu: {item.color}, Size: {item.size}) - Số lượng: {item.quantity} - Giá: ₫{new Intl.NumberFormat('vi-VN').format(item.unitPrice)}
                    </li>
                  ))}
                </ul>
              </p>
            </div>
          )
        }}
      />
    </div>
  );
};

export default AdminPaymentManage;
