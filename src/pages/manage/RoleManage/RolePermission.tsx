import React, { useState } from 'react';
import { Form, Button, Table, Space, Tag, Select, Typography } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IRole, IPermission, IRolePermission } from './types';

const { Title } = Typography;

interface RolePermissionTabProps {
  roles: IRole[];
  permissions: IPermission[];
  rolePermissions: IRolePermission[];
  setRolePermissions: React.Dispatch<React.SetStateAction<IRolePermission[]>>;
}

interface IRolePermissionRecord {
  roleId: string;
  permissionIds: string[];
}

export default function RolePermissionTab({
  roles,
  permissions,
  rolePermissions,
  setRolePermissions
}: RolePermissionTabProps) {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');

  const isEditing = (record: IRolePermissionRecord) => record.roleId === editingKey;

  const edit = (record: IRolePermissionRecord) => {
    form.setFieldsValue({ permissionIds: record.permissionIds });
    setEditingKey(record.roleId);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (roleId: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...rolePermissions];
      const index = newData.findIndex((item) => item.roleId === roleId);

      if (index > -1) {
        newData[index].permissionIds = row.permissionIds || [];
      } else {
        newData.push({ roleId, permissionIds: row.permissionIds || [] });
      }

      setRolePermissions(newData);
      setEditingKey('');
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const columns = [
    {
      title: 'Vai trò (Role)',
      dataIndex: 'roleId',
      width: 200,
      render: (roleId: string) => {
        const role = roles.find((r) => r.id === roleId);
        return (
          <Tag color='geekblue' className='text-sm px-2 py-1'>
            {role?.name || roleId}
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
            <Button type='primary' size='small' onClick={() => save(record.roleId)} icon={<SaveOutlined />} />
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

  // Map roles into dataSource for table
  const dataSource: IRolePermissionRecord[] = roles.map((r) => {
    const rp = rolePermissions.find((x) => x.roleId === r.id);
    return {
      roleId: r.id,
      permissionIds: rp ? rp.permissionIds : []
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
