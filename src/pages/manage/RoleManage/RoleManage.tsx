import React, { useState } from 'react';
import { Tabs, Card, Typography } from 'antd';
import { UsergroupAddOutlined, SafetyCertificateOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons';
import { IRole, IPermission, IRolePermission, IUser, IUserRole } from './types';
import RoleTab from './Role';
import PermissionTab from './Permission';
import RolePermissionTab from './RolePermission';
import UserRoleTab from './UserRole';

const { Title } = Typography;

// --- Mock Initial Data ---
const initialRoles: IRole[] = [
  { id: 'role_1', name: 'Admin', description: 'Quản trị viên toàn quyền' },
  { id: 'role_2', name: 'Manager', description: 'Quản lý cửa hàng/dự án' },
  { id: 'role_3', name: 'User', description: 'Người dùng cơ bản' }
];

const initialPermissions: IPermission[] = [
  { id: 'perm_1', code: 'VIEW_DASHBOARD', name: 'Xem thống kê Dashboard' },
  { id: 'perm_2', code: 'MANAGE_USERS', name: 'Quản lý người dùng' },
  { id: 'perm_3', code: 'MANAGE_PRODUCTS', name: 'Quản lý sản phẩm' },
  { id: 'perm_4', code: 'VIEW_ORDERS', name: 'Xem đơn hàng' }
];

const initialRolePermissions: IRolePermission[] = [
  { roleId: 'role_1', permissionIds: ['perm_1', 'perm_2', 'perm_3', 'perm_4'] },
  { roleId: 'role_2', permissionIds: ['perm_1', 'perm_3', 'perm_4'] },
  { roleId: 'role_3', permissionIds: ['perm_4'] }
];

const initialUsers: IUser[] = [
  { id: 'user_1', username: 'admin_master', fullName: 'Hệ thống Admin' },
  { id: 'user_2', username: 'manager_01', fullName: 'Ngân Nguyễn' },
  { id: 'user_3', username: 'user_basic', fullName: 'Người dùng test' }
];

const initialUserRoles: IUserRole[] = [
  { userId: 'user_1', roleIds: ['role_1'] },
  { userId: 'user_2', roleIds: ['role_2'] },
  { userId: 'user_3', roleIds: ['role_3'] }
];

export default function RoleManage() {
  // Global States in this page
  const [roles, setRoles] = useState<IRole[]>(initialRoles);
  const [permissions, setPermissions] = useState<IPermission[]>(initialPermissions);
  const [rolePermissions, setRolePermissions] = useState<IRolePermission[]>(initialRolePermissions);
  const [users] = useState<IUser[]>(initialUsers);
  const [userRoles, setUserRoles] = useState<IUserRole[]>(initialUserRoles);

  const items = [
    {
      key: '1',
      label: (
        <span className='font-semibold text-[15px]'>
          <UsergroupAddOutlined className='mr-2' />
          Vai trò (Roles)
        </span>
      ),
      children: <RoleTab roles={roles} setRoles={setRoles} />
    },
    {
      key: '2',
      label: (
        <span className='font-semibold text-[15px]'>
          <SafetyCertificateOutlined className='mr-2' />
          Quyền hành (Permissions)
        </span>
      ),
      children: <PermissionTab permissions={permissions} setPermissions={setPermissions} />
    },
    {
      key: '3',
      label: (
        <span className='font-semibold text-[15px]'>
          <UnlockOutlined className='mr-2' />
          Phân Quyền
        </span>
      ),
      children: (
        <RolePermissionTab
          roles={roles}
          permissions={permissions}
          rolePermissions={rolePermissions}
          setRolePermissions={setRolePermissions}
        />
      )
    },
    {
      key: '4',
      label: (
        <span className='font-semibold text-[15px]'>
          <UserOutlined className='mr-2' />
          Người dùng
        </span>
      ),
      children: <UserRoleTab users={users} roles={roles} userRoles={userRoles} setUserRoles={setUserRoles} />
    }
  ];

  return (
    <Card className='w-full shadow-sm rounded-xl border-none h-full min-h-[calc(100vh-120px)]'>
      <div className='mb-6 border-b pb-4'>
        <Title level={3} className='!mb-1 text-gray-800'>
          Quản trị Hệ thống Quyền
        </Title>
        <p className='text-gray-500'>Cấu hình các vai trò và quyền truy cập vào các chức năng của ứng dụng.</p>
      </div>

      <Tabs defaultActiveKey='1' items={items} size='large' className='role-manage-tabs' />
    </Card>
  );
}
