import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, DatePicker, InputNumber, Switch, message, Tag, Typography, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import moment from 'moment';

const { Title } = Typography;

const AdminVoucherManage: React.FC = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

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

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        code: record.code,
        discountValue: record.discountValue,
        minOrderValue: record.minOrderValue,
        quantity: record.quantity || 0,
        isActive: record.isActive
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ quantity: 0, isActive: true });
    }

    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        ...values
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
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => val === 0 ? <Tag color="orange">Không giới hạn</Tag> : <Tag color="blue">{new Intl.NumberFormat('vi-VN').format(val)}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => {
        if (!isActive) return <Tag color="red">Bị khóa (Đã dùng)</Tag>;
        return <Tag color="green">Đang hoạt động</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Bạn có chắc muốn xóa Voucher này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
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

          <div className="flex gap-4">
            <Form.Item name="discountValue" label="Số tiền giảm (VNĐ)" className="flex-1" rules={[{ required: true, message: 'Nhập số tiền giảm' }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="minOrderValue" label="Đơn tối thiểu (VNĐ)" className="flex-1" rules={[{ required: true }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item name="quantity" label="Số lượng phát hành" className="flex-1" rules={[{ required: true }]}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="isActive" label="Trạng thái kích hoạt" valuePropName="checked">
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
    </div>
  );
};

export default AdminVoucherManage;
