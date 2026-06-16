import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Modal, Form, Input, Checkbox, message, Popconfirm, Tag, Spin, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import http from '@/apis/http';

const { Title, Text } = Typography;

export default function AddressManage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [shippingFeesList, setShippingFeesList] = useState<any[]>([]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/UserAddress');
      setAddresses(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingFees = async () => {
    try {
      const res = await http.get('/api/ShippingFee');
      setShippingFeesList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchShippingFees();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    
    let address = record.address || '';
    let ward = '';
    let province = '';
    
    const parts = address.split(', ').map((p: string) => p.trim());
    if (parts.length >= 3) {
      province = parts.pop() || '';
      ward = parts.pop() || '';
      address = parts.join(', ');
    } else if (parts.length === 2) {
      province = parts.pop() || '';
      address = parts[0];
    }

    form.setFieldsValue({
      recipientName: record.recipientName,
      phoneNumber: record.phoneNumber,
      email: record.email,
      address: address,
      ward: ward,
      province: province,
      isDefault: record.isDefault,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await http.delete(`/api/UserAddress/${id}`);
      message.success('Đã xóa địa chỉ');
      fetchAddresses();
    } catch (error) {
      message.error('Lỗi khi xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await http.put(`/api/UserAddress/${id}/set-default`, {});
      message.success('Đã đặt làm mặc định');
      fetchAddresses();
    } catch (error) {
      message.error('Lỗi khi cập nhật địa chỉ');
    }
  };

  const handleSave = async (values: any) => {
    try {
      const fullAddress = `${values.address}, ${values.ward ? values.ward + ', ' : ''}${values.province}`;
      const payload = {
        recipientName: values.recipientName,
        phoneNumber: values.phoneNumber,
        email: values.email,
        address: fullAddress,
        isDefault: values.isDefault
      };

      if (editingId) {
        await http.put(`/api/UserAddress/${editingId}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await http.post('/api/UserAddress', payload);
        message.success('Thêm địa chỉ thành công');
      }
      setIsModalVisible(false);
      fetchAddresses();
    } catch (error) {
      message.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className='p-6 bg-white rounded-lg shadow-sm min-h-[500px]'>
      <div className='flex justify-between items-center mb-6'>
        <Title level={4} className='!mb-0'>Sổ địa chỉ</Title>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm địa chỉ mới
        </Button>
      </div>

      <Spin spinning={loading}>
        <div className='flex flex-col gap-4'>
          {addresses.length === 0 ? (
            <div className='text-center py-10 text-gray-500'>Bạn chưa có địa chỉ nào.</div>
          ) : (
            addresses.map((addr) => (
              <Card key={addr.id} size='small' className={addr.isDefault ? 'border-primary border-2' : ''}>
                <div className='flex justify-between'>
                  <div>
                    <div className='flex items-center gap-2 mb-2'>
                      <Text strong className='text-lg'>{addr.recipientName}</Text>
                      {addr.isDefault && <Tag color='orange'>Mặc định</Tag>}
                    </div>
                    <div className='text-gray-600 mb-1'>
                      <Text type='secondary'>Điện thoại: </Text> {addr.phoneNumber}
                    </div>
                    {addr.email && (
                      <div className='text-gray-600 mb-1'>
                        <Text type='secondary'>Email: </Text> {addr.email}
                      </div>
                    )}
                    <div className='text-gray-600'>
                      <Text type='secondary'>Địa chỉ: </Text> {addr.address}
                    </div>
                  </div>
                  <div className='flex flex-col items-end gap-2'>
                    <div className='flex gap-2'>
                      <Button type='text' icon={<EditOutlined />} onClick={() => handleEdit(addr)}>Sửa</Button>
                      <Popconfirm title='Bạn có chắc chắn muốn xóa?' onConfirm={() => handleDelete(addr.id)}>
                        <Button type='text' danger icon={<DeleteOutlined />}>Xóa</Button>
                      </Popconfirm>
                    </div>
                    {!addr.isDefault && (
                      <Button size='small' onClick={() => handleSetDefault(addr.id)}>
                        Thiết lập mặc định
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Spin>

      <Modal
        title={editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout='vertical' onFinish={handleSave}>
          <Form.Item name='recipientName' label='Họ và tên' rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder='Họ và tên người nhận' />
          </Form.Item>
          <Form.Item name='phoneNumber' label='Số điện thoại' rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
            <Input placeholder='Số điện thoại' />
          </Form.Item>
          <Form.Item name='email' label='Địa chỉ email' rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder='Email của bạn' />
          </Form.Item>
          <div className='flex gap-4'>
            <Form.Item name='province' label='Tỉnh/Thành phố' className='flex-1' rules={[{ required: true, message: 'Chọn tỉnh/thành phố' }]}>
              <Select placeholder='Chọn Tỉnh/Thành phố' options={
                shippingFeesList.length > 0 
                  ? shippingFeesList.map(f => ({ value: f.provinceName, label: f.provinceName }))
                  : [
                      { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
                      { value: 'Hà Nội', label: 'Hà Nội' },
                      { value: 'Đà Nẵng', label: 'Đà Nẵng' },
                      { value: 'Khác', label: 'Khác' }
                    ]
              } />
            </Form.Item>
            <Form.Item name='ward' label='Xã/Phường' className='flex-1'>
              <Input placeholder='Nhập xã/phường' />
            </Form.Item>
          </div>
          <Form.Item name='address' label='Địa chỉ cụ thể' rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}>
            <Input placeholder='Số nhà, tên đường...' />
          </Form.Item>
          <Form.Item name='isDefault' valuePropName='checked'>
            <Checkbox>Đặt làm địa chỉ mặc định</Checkbox>
          </Form.Item>
          <div className='flex justify-end gap-2 mt-4'>
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type='primary' htmlType='submit'>Lưu thay đổi</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
