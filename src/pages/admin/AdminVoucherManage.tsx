import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, DatePicker, InputNumber, Switch, message, Tag, Typography, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import moment from 'moment';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminVoucherManage: React.FC = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Voucher Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  // States for Users Modal
  const [isUsersModalVisible, setIsUsersModalVisible] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<number | null>(null);
  const [voucherUsers, setVoucherUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string | null>(null);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Voucher/admin');
      setVouchers(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách Voucher');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await http.get('/api/User');
      setAllUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchAllUsers();
  }, []);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        code: record.code,
        discountValue: record.discountValue,
        minOrderValue: record.minOrderValue,
        quantity: record.totalQuantity !== undefined ? record.totalQuantity : (record.quantity || 0),
        isActived: record.isActived,
        dateRange: [
          record.startDate ? moment(record.startDate) : moment(),
          record.endDate ? moment(record.endDate) : moment().add(7, 'days')
        ]
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ 
        quantity: 0, 
        isActived: true,
        dateRange: [moment(), moment().add(7, 'days')]
      });
    }

    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        code: values.code,
        discountValue: values.discountValue,
        minOrderValue: values.minOrderValue,
        quantity: values.quantity,
        isActived: values.isActived,
        startDate: values.dateRange ? values.dateRange[0].toISOString() : null,
        endDate: values.dateRange ? values.dateRange[1].toISOString() : null,
      };

      if (editingId) {
        await http.put(`/api/Voucher/admin/${editingId}`, payload);
        message.success('Cập nhật Voucher thành công');
      } else {
        await http.post('/api/Voucher/admin', payload);
        message.success('Tạo Voucher mới thành công');
      }
      setIsModalVisible(false);
      fetchVouchers();
    } catch (error: any) {
      message.error(error.response?.data || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await http.delete(`/api/Voucher/admin/${id}`);
      message.success('Xóa Voucher thành công');
      fetchVouchers();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa Voucher');
    }
  };

  const handleOpenUsersModal = async (record: any) => {
    setSelectedVoucherId(record.id);
    setIsUsersModalVisible(true);
    await fetchVoucherUsers(record.id);
  };

  const fetchVoucherUsers = async (id: number) => {
    try {
      setUsersLoading(true);
      const res = await http.get(`/api/Voucher/admin/${id}/users`);
      setVoucherUsers(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách User của Voucher');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAssignVoucher = async () => {
    if (!selectedVoucherId || !selectedUserToAssign) return;
    try {
      setUsersLoading(true);
      await http.post(`/api/Voucher/admin/${selectedVoucherId}/assign/${selectedUserToAssign}`);
      message.success('Cấp phát Voucher thành công');
      setSelectedUserToAssign(null);
      await fetchVoucherUsers(selectedVoucherId);
      fetchVouchers(); // Refresh stock quantity
    } catch (error: any) {
      message.error(error.response?.data || 'Có lỗi xảy ra');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRevokeVoucher = async (userId: string) => {
    if (!selectedVoucherId) return;
    try {
      setUsersLoading(true);
      await http.delete(`/api/Voucher/admin/${selectedVoucherId}/revoke/${userId}`);
      message.success('Thu hồi Voucher thành công');
      await fetchVoucherUsers(selectedVoucherId);
      fetchVouchers(); // Refresh stock quantity
    } catch (error: any) {
      message.error(error.response?.data || 'Có lỗi xảy ra');
    } finally {
      setUsersLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã Voucher',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue" className="text-base font-bold">{text}</Tag>
    },
    {
      title: 'Giảm giá',
      key: 'discountValue',
      render: (_: any, record: any) => (
        <span className="font-bold text-[#ee4d2d]">
          {`${new Intl.NumberFormat('vi-VN').format(record.discountValue)}đ`}
        </span>
      )
    },
    {
      title: 'Đơn tối thiểu',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      render: (val: number) => `${new Intl.NumberFormat('vi-VN').format(val)}đ`
    },
    {
      title: 'Số lượng phát hành',
      key: 'quantityInfo',
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-1">
          <Tag color="cyan" className="m-0 text-center">Tổng đã tạo: {new Intl.NumberFormat('vi-VN').format(record.totalQuantity || record.quantity)}</Tag>
          <Tag color="purple" className="m-0 text-center">Đã cấp (User): {new Intl.NumberFormat('vi-VN').format(record.givenQuantity || 0)}</Tag>
          <Tag color={record.remainingQuantity <= 0 ? "orange" : "blue"} className="m-0 text-center">
            Còn lại: {new Intl.NumberFormat('vi-VN').format(record.remainingQuantity !== undefined ? record.remainingQuantity : record.quantity)}
          </Tag>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        const isOutOfStock = record.quantity <= 0;
        const isExpired = new Date(record.endDate).getTime() < new Date().getTime();

        if (isOutOfStock) return <Tag color="orange">Đã hết</Tag>;
        if (isExpired) return <Tag color="red">Hết hạn</Tag>;
        if (record.isActived === false || record.isActive === false) return <Tag color="default">Bị khóa</Tag>;
        
        return <Tag color="green">Đang hoạt động</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Button type="text" icon={<TeamOutlined />} onClick={() => handleOpenUsersModal(record)} />
          <Popconfirm title="Bạn có chắc muốn xóa Voucher này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const userColumns = [
    { title: 'Tên Khách Hàng', dataIndex: 'userName', key: 'userName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isUsed', 
      key: 'isUsed',
      render: (isUsed: boolean) => isUsed ? <Tag color="red">Đã sử dụng</Tag> : <Tag color="green">Chưa dùng</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm title="Thu hồi Voucher của User này?" onConfirm={() => handleRevokeVoucher(record.userId)} disabled={record.isUsed}>
          <Button type="link" danger disabled={record.isUsed}>Thu hồi</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className='mb-0'>
          Quản lý Voucher
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-[#82b541] border-none">
          Tạo Voucher mới
        </Button>
      </div>

      <Table
        dataSource={vouchers}
        columns={columns}
        rowKey='id'
        loading={loading}
      />

      {/* MODAL VOUCHER */}
      <Modal
        title={editingId ? "Sửa Voucher" : "Tạo Voucher mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="code" label="Mã Voucher (Code)" rules={[{ required: true, message: 'Vui lòng nhập mã' }]}>
            <Input placeholder="Ví dụ: SUMMER2024" className="uppercase" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="discountValue" label="Số tiền giảm (VNĐ)" rules={[{ required: true, message: 'Nhập số tiền giảm' }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="minOrderValue" label="Đơn tối thiểu (VNĐ)" rules={[{ required: true }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="quantity" label="Số lượng phát hành" rules={[{ required: true }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="dateRange" label="Thời gian có hiệu lực" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
              <RangePicker showTime format="YYYY-MM-DD HH:mm" className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="isActived" label="Trạng thái kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" className="bg-[#82b541] border-none">
              Lưu Voucher
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL USERS */}
      <Modal
        title="Danh sách User sở hữu Voucher"
        open={isUsersModalVisible}
        onCancel={() => setIsUsersModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="flex gap-2 mb-4">
          <Select
            showSearch
            placeholder="Tìm kiếm User theo Email..."
            optionFilterProp="children"
            className="flex-1"
            value={selectedUserToAssign}
            onChange={setSelectedUserToAssign}
            filterOption={(input, option) => {
              const childrenString = String(option?.children || '');
              return childrenString.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {allUsers.map(u => (
              <Select.Option key={u.id} value={u.id}>{u.email}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<UserAddOutlined />} onClick={handleAssignVoucher} loading={usersLoading} disabled={!selectedUserToAssign}>
            Tặng Voucher
          </Button>
        </div>
        
        <Table
          dataSource={voucherUsers}
          columns={userColumns}
          rowKey='id'
          loading={usersLoading}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default AdminVoucherManage;
