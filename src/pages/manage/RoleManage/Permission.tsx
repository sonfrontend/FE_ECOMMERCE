import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IPermission } from './types';
import http from '@/apis/http';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';

const { Title } = Typography;

export default function PermissionTab() {
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await http.get('/api/Permission');
        if (res.status === 200) {
          const mappedPerms = res.data.map((item) => ({
            id: item.permissionId,
            code: item.permissionName,
            name: item.description
          }));
          setPermissions(mappedPerms);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };
    fetchPermissions();
  }, []);

  const isEditing = (record: IPermission) => record.id === editingKey;

  const handleEdit = (record: IPermission) => {
    setAction('edit');
    form.setFieldsValue({ code: '', name: '', ...record });
    setEditingKey(record.id);
  };

  const handleCancel = (id: string) => {
    setEditingKey('');
    if (id.startsWith('temp_')) {
      setPermissions(permissions.filter((p) => p.id !== id));
    }
  };

  const handleSave = async (key: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...permissions];
      const index = newData.findIndex((item) => key === item.id);

      if (index > -1) {
        const item = newData[index];
        const updatedItem = { ...item, ...row };

        let res;

        if (action === 'add') {
          res = await handleApiAdd(updatedItem);
        } else if (action === 'edit') {
          res = await handleApiEdit(updatedItem);
        }

        if (res && res.status === 200) {
          const dataFromDB = {
            id: res.data.permission.permissionId,
            code: res.data.permission.permissionName,
            name: res.data.permission.description
          };
          newData.splice(index, 1, dataFromDB);
          setPermissions(newData);
          setEditingKey('');
        }
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleDelete = async (record: IPermission) => {
    try {
      const res = await handleApiDelete(record.id);
      if (res && res.status === 200) {
        toast.success(res.data.message || 'Xóa quyền thành công');
        setPermissions(permissions.filter((item) => item.id !== record.id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = () => {
    setAction('add');
    const newId = `temp_${uuid()}`;
    const newRecord = { id: newId, code: '', name: '' };
    if (!editingKey) {
      setPermissions([newRecord, ...permissions]);
      form.setFieldsValue({ code: '', name: '' });
      setEditingKey(newId);
    }
  };

  const handleApiAdd = async (permission: IPermission) => {
    setIsLoading(true);
    try {
      const payload = {
        permissionName: permission.code,
        description: permission.name
      };
      const res = await http.post('/api/Permission', payload);
      if (res.status === 200) {
        toast.success(res.data.message || 'Thêm quyền thành công');
        setIsLoading(false);
        return res;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.response?.data?.message || 'Thêm quyền thất bại');
    }
  };

  const handleApiEdit = async (permission: IPermission) => {
    setIsLoading(true);
    try {
      const payload = {
        permissionId: permission.id,
        permissionName: permission.code,
        description: permission.name
      };
      const res = await http.put(`/api/Permission/${permission.id}`, payload);
      if (res.status === 200) {
        setIsLoading(false);
        return res;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.response?.data?.message || 'Sửa quyền thất bại');
    }
  };

  const handleApiDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await http.delete(`/api/Permission/${id}`);
      if (res.status === 200) {
        setIsLoading(false);
        return res;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.response?.data?.message || 'Xóa quyền thất bại');
    }
  };

  const columns = [
    {
      title: 'Mã quyền (Code)',
      dataIndex: 'code',
      render: (text: string, record: IPermission) =>
        isEditing(record) ? (
          <Form.Item name='code' style={{ margin: 0 }} rules={[{ required: true, message: 'Nhập mã quyền!' }]}>
            <Input placeholder='Vd: CREATE_USER...' />
          </Form.Item>
        ) : (
          <Tag color='volcano' className='font-mono'>
            {text}
          </Tag>
        )
    },
    {
      title: 'Tên quyền',
      dataIndex: 'name',
      render: (text: string, record: IPermission) =>
        isEditing(record) ? (
          <Form.Item name='name' style={{ margin: 0 }} rules={[{ required: true, message: 'Nhập tên quyền!' }]}>
            <Input placeholder='Nhập tên...' />
          </Form.Item>
        ) : (
          text
        )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 150,
      align: 'center' as const,
      render: (_: unknown, record: IPermission) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type='primary'
              size='small'
              onClick={() => handleSave(record.id)}
              icon={<SaveOutlined />}
              loading={isLoading}
            />
            <Button
              size='small'
              onClick={() => handleCancel(record.id)}
              icon={<CloseOutlined />}
              disabled={isLoading}
            />
          </Space>
        ) : (
          <Space>
            <Button
              type='text'
              onClick={() => handleEdit(record)}
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              disabled={editingKey !== ''}
            />
            <Popconfirm title='Chắc chắn xóa quyền này?' onConfirm={() => handleDelete(record)}>
              <Button type='text' danger icon={<DeleteOutlined />} disabled={editingKey !== ''} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div className='animate-fade-in p-1'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <Title level={5} className='!mb-1'>
            Danh sách Quyền (Permissions)
          </Title>
          <p className='text-gray-500 text-sm'>Các quyền hành động chi tiết có trong hệ thống</p>
        </div>
        <Button type='primary' onClick={handleAdd} icon={<PlusOutlined />} className='shadow-md'>
          Thêm Quyền mới
        </Button>
      </div>
      <Form form={form} component={false}>
        <Table
          bordered
          dataSource={permissions}
          columns={columns}
          rowKey='id'
          pagination={{ pageSize: 5 }}
          className='shadow-sm rounded-lg overflow-hidden'
        />
      </Form>
    </div>
  );
}
