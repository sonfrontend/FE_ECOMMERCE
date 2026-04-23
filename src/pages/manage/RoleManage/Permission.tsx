import React, { useState } from 'react';
import { Form, Input, Button, Table, Space, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IPermission } from './types';

const { Title } = Typography;

interface PermissionTabProps {
  permissions: IPermission[];
  setPermissions: React.Dispatch<React.SetStateAction<IPermission[]>>;
}

export default function PermissionTab({ permissions, setPermissions }: PermissionTabProps) {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record: IPermission) => record.id === editingKey;

  const edit = (record: IPermission) => {
    form.setFieldsValue({ code: '', name: '', ...record });
    setEditingKey(record.id);
  };

  const cancel = (id: string) => {
    setEditingKey('');
    if (id.startsWith('temp_')) {
      setPermissions(permissions.filter((p) => p.id !== id));
    }
  };

  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...permissions];
      const index = newData.findIndex((item) => key === item.id);

      if (index > -1) {
        const item = newData[index];
        const finalId = key.startsWith('temp_') ? `perm_${Date.now()}` : key;
        newData.splice(index, 1, { ...item, ...row, id: finalId });
        setPermissions(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleDelete = (key: string) => {
    setPermissions(permissions.filter((item) => item.id !== key));
  };

  const handleAdd = () => {
    const newId = `temp_${Date.now()}`;
    const newRecord = { id: newId, code: '', name: '' };
    setPermissions([newRecord, ...permissions]);
    form.setFieldsValue({ code: '', name: '' });
    setEditingKey(newId);
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
            <Button type='primary' size='small' onClick={() => save(record.id)} icon={<SaveOutlined />} />
            <Button size='small' onClick={() => cancel(record.id)} icon={<CloseOutlined />} />
          </Space>
        ) : (
          <Space>
            <Button
              type='text'
              onClick={() => edit(record)}
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              disabled={editingKey !== ''}
            />
            <Popconfirm title='Chắc chắn xóa quyền này?' onConfirm={() => handleDelete(record.id)}>
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
