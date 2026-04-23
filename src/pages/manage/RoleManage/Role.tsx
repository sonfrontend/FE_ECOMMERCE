import React, { useState } from 'react';
import { Form, Input, Button, Table, Space, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IRole } from './types';

const { Title } = Typography;

interface RoleTabProps {
  roles: IRole[];
  setRoles: React.Dispatch<React.SetStateAction<IRole[]>>;
}

export default function RoleTab({ roles, setRoles }: RoleTabProps) {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record: IRole) => record.id === editingKey;

  const edit = (record: IRole) => {
    form.setFieldsValue({ name: '', description: '', ...record });
    setEditingKey(record.id);
  };

  const cancel = (id: string) => {
    setEditingKey('');
    if (id.startsWith('temp_')) {
      setRoles(roles.filter((r) => r.id !== id));
    }
  };

  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...roles];
      const index = newData.findIndex((item) => key === item.id);

      if (index > -1) {
        const item = newData[index];
        const finalId = key.startsWith('temp_') ? `role_${Date.now()}` : key;
        newData.splice(index, 1, { ...item, ...row, id: finalId });
        setRoles(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleDelete = (key: string) => {
    setRoles(roles.filter((item) => item.id !== key));
  };

  const handleAdd = () => {
    const newId = `temp_${Date.now()}`;
    const newRecord = { id: newId, name: '', description: '' };
    setRoles([newRecord, ...roles]);
    form.setFieldsValue({ name: '', description: '' });
    setEditingKey(newId);
  };

  const columns = [
    {
      title: 'Tên Role',
      dataIndex: 'name',
      render: (text: string, record: IRole) =>
        isEditing(record) ? (
          <Form.Item name='name' style={{ margin: 0 }} rules={[{ required: true, message: 'Vui lòng nhập tên role!' }]}>
            <Input placeholder='Nhập tên...' />
          </Form.Item>
        ) : (
          <Tag color='geekblue' className='text-sm px-2 py-1'>
            {text}
          </Tag>
        )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      render: (text: string, record: IRole) =>
        isEditing(record) ? (
          <Form.Item name='description' style={{ margin: 0 }}>
            <Input placeholder='Nhập mô tả...' />
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
      render: (_: unknown, record: IRole) => {
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
            <Popconfirm title='Bạn có chắc là muốn xóa role này?' onConfirm={() => handleDelete(record.id)}>
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
            Danh sách vai trò (Roles)
          </Title>
          <p className='text-gray-500 text-sm'>Quản lý các nhóm quyền cho người dùng</p>
        </div>
        <Button type='primary' onClick={handleAdd} icon={<PlusOutlined />} className='shadow-md'>
          Thêm Role mới
        </Button>
      </div>
      <Form form={form} component={false}>
        <Table
          bordered
          dataSource={roles}
          columns={columns}
          rowKey='id'
          pagination={{ pageSize: 5 }}
          className='shadow-sm rounded-lg overflow-hidden'
        />
      </Form>
    </div>
  );
}
