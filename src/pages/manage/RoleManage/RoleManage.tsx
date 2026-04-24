import { SafetyCertificateOutlined, UnlockOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Tabs, Typography } from 'antd';
import React, { useState } from 'react';
import PermissionTab from './Permission';
import RoleTab from './Role';
import RolePermissionTab from './RolePermission';
import { IPermission, IRole, IRolePermission, IUser, IUserRole } from './types';
import UserRoleTab from './UserRole';

const { Title } = Typography;

export default function RoleManage() {
  // Global States in this page
  const [roles, setRoles] = useState<IRole[]>([]);
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<IRolePermission[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [userRoles, setUserRoles] = useState<IUserRole[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        };

        // Fetch Permissions
        const permRes = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/Permission`, { headers });
        if (permRes.ok) {
          const permData = await permRes.json();
          const mappedPerms = permData.map((item) => ({
            id: item.permissionId,
            code: item.permissionName,
            name: item.description
          }));
          setPermissions(mappedPerms);
        }

        // Fetch Roles
        const roleRes = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/Role`, { headers });
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          const mappedRoles = roleData.map((item) => ({
            id: item.roleId,
            name: item.roleName,
            description: '' // Backend Role doesn't have description field
          }));
          setRoles(mappedRoles);
        }

        // Fetch RolePermissions
        const rpRes = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/RolePermission`, { headers });
        if (rpRes.ok) {
          const rpData = await rpRes.json();
          const grouped: Record<string, string[]> = {};
          rpData.forEach((item) => {
            const roleId = item.roleId;
            const permId = item.permissionId;
            if (!grouped[roleId]) {
              grouped[roleId] = [];
            }
            grouped[roleId].push(permId);
          });

          const mappedRP: IRolePermission[] = Object.keys(grouped).map((roleId) => ({
            roleId: roleId,
            permissionIds: grouped[roleId]
          }));
          setRolePermissions(mappedRP);
        }

        // Fetch Users
        const userRes = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/User`, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          const mappedUsers = userData.map((item) => ({
            id: item.userId,
            username: item.userName,
            fullName: item.fullName
          }));
          setUsers(mappedUsers);
        }

        // Fetch UserRoles
        const urRes = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/User/userRole`, { headers });
        if (urRes.ok) {
          const urData = await urRes.json();
          const groupedUR: Record<string, string[]> = {};
          urData.forEach((item) => {
            const userId = item.userId;
            const roleId = item.roleId;
            if (!groupedUR[userId]) {
              groupedUR[userId] = [];
            }
            groupedUR[userId].push(roleId);
          });

          const mappedUR: IUserRole[] = Object.keys(groupedUR).map((userId) => ({
            userId: userId,
            roleIds: groupedUR[userId]
          }));
          setUserRoles(mappedUR);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

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
