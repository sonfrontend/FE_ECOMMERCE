import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Space, Tag, Select, Typography } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IRole, IPermission } from './types';
import http from '@/apis/http';
import { toast } from 'react-toastify';

const { Title } = Typography;

interface IRawRolePermission {
  rolePermissionId: string;
  roleId: string;
  permissionId: string;
}

interface IRolePermissionRecord {
  roleId: string;
  permissionIds: string[];
}

export default function RolePermissionTab() {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [rawRolePermissions, setRawRolePermissions] = useState<IRawRolePermission[]>([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchRolePermissions = async () => {
    try {
      const rpRes = await http.get('/api/RolePermission');
      console.log(rpRes);

      if (rpRes.status === 200) {
        const rpData = Array.isArray(rpRes.data) ? rpRes.data : rpRes.data?.data || [];
        const rawRP = rpData.map((item) => ({
          rolePermissionId: item.rolePermissionId?.toLowerCase(),
          roleId: item.roleId?.toLowerCase(),
          permissionId: item.permissionId?.toLowerCase()
        }));
        setRawRolePermissions(rawRP);
      }
    } catch (error) {
      console.error('Failed to fetch RolePermissions:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roleRes, permRes] = await Promise.all([http.get('/api/Role'), http.get('/api/Permission')]);

        if (roleRes.status === 200) {
          const rolesData = Array.isArray(roleRes.data) ? roleRes.data : roleRes.data?.data || [];
          setRoles(
            rolesData.map((item) => ({
              roleId: item.roleId?.toLowerCase(),
              roleName: item.roleName
            }))
          );
        }

        if (permRes.status === 200) {
          const permsData = Array.isArray(permRes.data) ? permRes.data : permRes.data?.data || [];
          setPermissions(
            permsData.map((item) => ({
              id: item.permissionId?.toLowerCase(),
              code: item.permissionName,
              name: item.description
            }))
          );
        }

        await fetchRolePermissions();
      } catch (error) {
        console.error('Failed to fetch data for RolePermission:', error);
      }
    };
    fetchData();
  }, []);

  const isEditing = (record: IRolePermissionRecord) => record.roleId === editingKey;

  const handleEdit = (record: IRolePermissionRecord) => {
    form.setFieldsValue({ permissionIds: record.permissionIds });
    setEditingKey(record.roleId);
  };

  const handleCancel = () => {
    setEditingKey('');
  };

  const handleSave = async (roleId: string) => {
    try {
      const row = await form.validateFields();
      const newPermissionIds: string[] = row.permissionIds || [];

      const rps = rawRolePermissions.filter((x) => x.roleId === roleId);
      const oldPermissionIds = rps.map((x) => x.permissionId);

      const toAdd = newPermissionIds.filter((id) => !oldPermissionIds.includes(id));
      const toRemove = oldPermissionIds.filter((id) => !newPermissionIds.includes(id));

      if (toAdd.length === 0 && toRemove.length === 0) {
        setEditingKey('');
        return;
      }

      setIsLoading(true);

      for (const permissionId of toAdd) {
        await http.post('/api/RolePermission', { roleId, permissionId });
      }

      for (const permissionId of toRemove) {
        const rpToDelete = rps.find((x) => x.permissionId === permissionId);
        if (rpToDelete) {
          await http.delete(`/api/RolePermission/${rpToDelete.rolePermissionId}`);
        }
      }

      toast.success('Cập nhật quyền thành công');
      await fetchRolePermissions();
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
      title: 'Vai trò (Role)',
      dataIndex: 'roleId',
      width: 200,
      render: (roleId: string) => {
        const role = roles.find((r) => r.roleId === roleId);
        return (
          <Tag color='geekblue' className='text-sm px-2 py-1'>
            {role?.roleName || roleId}
          </Tag>
        );
      }
    },
    {
      title: 'Các quyền được cấp',
      dataIndex: 'permissionIds',
      render: (pIds: string[], record: IRolePermissionRecord) => {
        if (isEditing(record)) {
          return (
            <Form.Item name='permissionIds' style={{ margin: 0 }}>
              <Select
                mode='multiple'
                allowClear
                style={{ width: '100%' }}
                placeholder='Chọn quyền...'
                options={permissions.map((p) => ({ label: p.name, value: p.id }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          );
        }
        return (
          <Space wrap size={[0, 8]}>
            {pIds && pIds.length > 0 ? (
              pIds.map((id) => {
                const perm = permissions.find((p) => p.id === id);
                return (
                  <Tag color='green' key={id}>
                    {perm?.name || id}
                  </Tag>
                );
              })
            ) : (
              <span className='text-gray-400 italic'>Chưa cấp quyền nào</span>
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
      render: (_: unknown, record: IRolePermissionRecord) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type='primary'
              size='small'
              onClick={() => handleSave(record.roleId)}
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

  const dataSource: IRolePermissionRecord[] = roles.map((r) => {
    const rps = rawRolePermissions.filter((x) => x.roleId === r.roleId);
    return {
      roleId: r.roleId,
      permissionIds: rps.map((x) => x.permissionId)
    };
  });

  return (
    <div className='animate-fade-in p-1'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <Title level={5} className='!mb-1'>
            Gán quyền cho Vai trò
          </Title>
          <p className='text-gray-500 text-sm'>Chỉnh sửa để thêm hoặc bớt quyền của từng vai trò.</p>
        </div>
      </div>
      <Form form={form} component={false}>
        <Table
          bordered
          dataSource={dataSource}
          columns={columns}
          rowKey='roleId'
          pagination={false}
          className='shadow-sm rounded-lg overflow-hidden'
        />
      </Form>
    </div>
  );
}
