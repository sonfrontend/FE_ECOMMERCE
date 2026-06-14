import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Typography, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import http from '@/apis/http';

const { Title } = Typography;

const ShippingFeeManage: React.FC = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchFees = async () => {
    try {
      const res = await http.get('/api/ShippingFee');
      setFees(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách phí vận chuyển');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      provinceName: record.provinceName,
      fee: record.fee
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xóa cấu hình',
      content: 'Bạn có chắc chắn muốn xóa phí vận chuyển của tỉnh này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await http.delete(`/api/ShippingFee/${id}`);
          message.success('Đã xóa thành công');
          fetchFees();
        } catch (error) {
          message.error('Xóa thất bại');
        }
      }
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await http.put(`/api/ShippingFee/${editingId}`, values);
        message.success('Cập nhật thành công');
      } else {
        await http.post('/api/ShippingFee', values);
        message.success('Thêm mới thành công');
      }
      setIsModalVisible(false);
      fetchFees();
    } catch (error: any) {
      if (error.response && error.response.data) {
        message.error(error.response.data);
      }
    }
  };

  const columns = [
    {
      title: 'Tỉnh / Thành phố',
      dataIndex: 'provinceName',
      key: 'provinceName',
    },
    {
      title: 'Phí Vận Chuyển',
      dataIndex: 'fee',
      key: 'fee',
      render: (fee: number) => <span className="font-bold text-[#ee4d2d]">{new Intl.NumberFormat('vi-VN').format(fee)} VNĐ</span>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <div className='flex justify-between items-center mb-6'>
        <Title level={3} className='m-0!'>Quản lý Phí Vận Chuyển</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm Mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={fees}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? "Sửa phí vận chuyển" : "Thêm phí vận chuyển"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="provinceName"
            label="Tên Tỉnh / Thành phố"
            rules={[{ required: true, message: 'Vui lòng nhập tên tỉnh' }]}
          >
            <Input placeholder="VD: Hồ Chí Minh, Hà Nội, Đà Nẵng..." />
          </Form.Item>

          <Form.Item
            name="fee"
            label="Phí ship (Tối đa 50.000 VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập phí' },
              { type: 'number', max: 50000, message: 'Phí không được vượt quá 50.000 VNĐ' },
              { type: 'number', min: 0, message: 'Phí không được âm' }
            ]}
          >
            <InputNumber 
              className="w-full" 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              addonAfter="VNĐ"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShippingFeeManage;
