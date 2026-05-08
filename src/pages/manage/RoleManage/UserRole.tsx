import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Space, Tag, Select, Typography } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IUser, IRole } from './types';
import http from '@/apis/http';
import { toast } from 'react-toastify';

const { Title } = Typography;

interface IRawUserRole {
  userRoleId: string;
  userId: string;
  roleId: string;
}

interface IUserRoleRecord {
  userId: string;
  roleIds: string[];
}

export default function UserRoleTab() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [rawUserRoles, setRawUserRoles] = useState<IRawUserRole[]>([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserRoles = async () => {
    try {
      const urRes = await http.get('/api/User/userRole');
      if (urRes.status === 200) {
        const urData = Array.isArray(urRes.data) ? urRes.data : urRes.data?.data || [];
        const rawUR = urData.map((item) => ({
          userRoleId: item.userRoleId?.toLowerCase(),
          userId: item.userId?.toLowerCase(),
          roleId: item.roleId?.toLowerCase()
        }));
        setRawUserRoles(rawUR);
      }
    } catch (error) {
      console.error('Failed to fetch UserRoles:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, roleRes] = await Promise.all([http.get('/api/User'), http.get('/api/Role')]);

        if (userRes.status === 200) {
          const usersData = Array.isArray(userRes.data) ? userRes.data : userRes.data?.data || [];
          setUsers(
            usersData.map((item) => ({
              id: item.userId?.toLowerCase(),
              username: item.userName,
              fullName: item.fullName
            }))
          );
        }

        if (roleRes.status === 200) {
          const rolesData = Array.isArray(roleRes.data) ? roleRes.data : roleRes.data?.data || [];
          setRoles(
            rolesData.map((item) => ({
              roleId: item.roleId?.toLowerCase(),
              roleName: item.roleName
            }))
          );
        }

        await fetchUserRoles();
      } catch (error) {
        console.error('Failed to fetch data for UserRole:', error);
      }
    };
    fetchData();
  }, []);

  const isEditing = (record: IUserRoleRecord) => record.userId === editingKey;

  const handleEdit = (record: IUserRoleRecord) => {
    form.setFieldsValue({ roleIds: record.roleIds });
    setEditingKey(record.userId);
  };

  const handleCancel = () => {
    setEditingKey('');
  };

  const handleSave = async (userId: string) => {
    try {
      const row = await form.validateFields();
      const newRoleIds: string[] = row.roleIds || [];

      const urs = rawUserRoles.filter((x) => x.userId === userId);
      const oldRoleIds = urs.map((x) => x.roleId);

      const toAdd = newRoleIds.filter((id) => !oldRoleIds.includes(id));
      const toRemove = oldRoleIds.filter((id) => !newRoleIds.includes(id));

      if (toAdd.length === 0 && toRemove.length === 0) {
        setEditingKey('');
        return;
      }

      setIsLoading(true);

      for (const roleId of toAdd) {
        await http.post('/api/User/userRole', { userId, roleId });
      }

      for (const roleId of toRemove) {
        const urToDelete = urs.find((x) => x.roleId === roleId);
        if (urToDelete) {
          await http.delete(`/api/User/userRole/${urToDelete.userRoleId}`);
        }
      }

      toast.success('Cập nhật vai trò thành công');
      await fetchUserRoles();
      setEditingKey('');
      setIsLoading(false);
    } catch (errInfo) {
      const error = errInfo;
      setIsLoading(false);
      const errorMsg =
        error?.response?.data?.message || error?.response?.data?.title || 'Cập nhật thất bại. Vui lòng thử lại!';
      toast.error(errorMsg);
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
                options={roles.map((r) => ({ label: r.roleName, value: r.roleId }))}
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
                const role = roles.find((r) => r.roleId === id);
                return (
                  <Tag color='geekblue' key={id}>
                    {role?.roleName || id}
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
            <Button
              type='primary'
              size='small'
              onClick={() => handleSave(record.userId)}
              icon={<SaveOutlined />}
              loading={isLoading}
            />
            <Button size='small' onClick={handleCancel} icon={<CloseOutlined />} disabled={isLoading} />
          </Space>
        ) : (
          <Space>
            <Button
              type='text'
              onClick={() => handleEdit(record)}
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              disabled={editingKey !== ''}
            />
          </Space>
        );
      }
    }
  ];

  const dataSource: IUserRoleRecord[] = users.map((u) => {
    const urs = rawUserRoles.filter((x) => x.userId === u.id);
    return {
      userId: u.id,
      roleIds: urs.map((x) => x.roleId)
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
