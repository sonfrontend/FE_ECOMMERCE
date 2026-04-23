import React, { useState } from 'react';
import { Form, Button, Table, Space, Tag, Select, Typography } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IUser, IRole, IUserRole } from './types';

const { Title } = Typography;

interface UserRoleTabProps {
  users: IUser[];
  roles: IRole[];
  userRoles: IUserRole[];
  setUserRoles: React.Dispatch<React.SetStateAction<IUserRole[]>>;
}

interface IUserRoleRecord {
  userId: string;
  roleIds: string[];
}

export default function UserRoleTab({ users, roles, userRoles, setUserRoles }: UserRoleTabProps) {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record: IUserRoleRecord) => record.userId === editingKey;

  const edit = (record: IUserRoleRecord) => {
    form.setFieldsValue({ roleIds: record.roleIds });
    setEditingKey(record.userId);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (userId: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...userRoles];
      const index = newData.findIndex((item) => item.userId === userId);

      if (index > -1) {
        newData[index].roleIds = row.roleIds || [];
      } else {
        newData.push({ userId, roleIds: row.roleIds || [] });
      }

      setUserRoles(newData);
      setEditingKey('');
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: 'Tài khoản người dùng',
      dataIndex: 'userId',
      width: 250,
      render: (userId: string) => {
        const user = users.find((u) => u.id === userId);
        return (
          <div className='flex flex-col'>
            <span className='font-semibold'>{user?.fullName || userId}</span>
            <span className='text-gray-400 text-xs'>@{user?.username}</span>
          </div>
        );
      }
    },
    {
      title: 'Các vai trò được cấp',
      dataIndex: 'roleIds',
      render: (rIds: string[], record: IUserRoleRecord) => {
        if (isEditing(record)) {
          return (
            <Form.Item name='roleIds' style={{ margin: 0 }}>
              <Select
                mode='multiple'
                allowClear
                style={{ width: '100%' }}
                placeholder='Chọn vai trò...'
                options={roles.map((r) => ({ label: r.name, value: r.id }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          );
        }
        return (
          <Space wrap size={[0, 8]}>
            {rIds && rIds.length > 0 ? (
              rIds.map((id) => {
                const role = roles.find((r) => r.id === id);
                return (
                  <Tag color='geekblue' key={id}>
                    {role?.name || id}
                  </Tag>
                );
              })
            ) : (
              <span className='text-gray-400 italic'>Chưa cấp vai trò nào</span>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      width: 150,
      align: 'center' as const,
      render: (_: unknown, record: IUserRoleRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button type='primary' size='small' onClick={() => save(record.userId)} icon={<SaveOutlined />} />
            <Button size='small' onClick={cancel} icon={<CloseOutlined />} />
          </Space>
        ) : (
          <Space>
            <Button
              type='text'
              onClick={() => edit(record)}
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              disabled={editingKey !== ''}
            />
          </Space>
        );
      }
    }
  ];

  // Map users into dataSource for table
  const dataSource: IUserRoleRecord[] = users.map((u) => {
    const ur = userRoles.find((x) => x.userId === u.id);
    return {
      userId: u.id,
      roleIds: ur ? ur.roleIds : []
    };
  });

  return (
    <div className='animate-fade-in p-1'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <Title level={5} className='!mb-1'>
            Gán Vai trò cho Người dùng
          </Title>
          <p className='text-gray-500 text-sm'>
            Lựa chọn một hoặc nhiều vai trò (Role) cho tài khoản sử dụng mảng hệ thống.
          </p>
        </div>
      </div>
      <Form form={form} component={false}>
        <Table
          bordered
          dataSource={dataSource}
          columns={columns}
          rowKey='userId'
          pagination={{ pageSize: 5 }}
          className='shadow-sm rounded-lg overflow-hidden'
        />
      </Form>
    </div>
  );
}
