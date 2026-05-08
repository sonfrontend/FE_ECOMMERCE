import { SafetyCertificateOutlined, UnlockOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Tabs, Typography } from 'antd';
import React from 'react';
import PermissionTab from './Permission';
import RoleTab from './Role';
import RolePermissionTab from './RolePermission';
import UserRoleTab from './UserRole';

const { Title } = Typography;

export default function RoleManage() {
  const items = [
    {
      key: '1',
      label: (
        <span className='font-semibold text-[15px]'>
          <UsergroupAddOutlined className='mr-2' />
          Vai trò (Roles)
        </span>
      ),
      children: <RoleTab />
    },
    {
      key: '2',
      label: (
        <span className='font-semibold text-[15px]'>
          <SafetyCertificateOutlined className='mr-2' />
          Quyền hành (Permissions)
        </span>
      ),
      children: <PermissionTab />
    },
    {
      key: '3',
      label: (
        <span className='font-semibold text-[15px]'>
          <UnlockOutlined className='mr-2' />
          Phân Quyền
        </span>
      ),
      children: <RolePermissionTab />
    },
    {
      key: '4',
      label: (
        <span className='font-semibold text-[15px]'>
          <UserOutlined className='mr-2' />
          Người dùng
        </span>
      ),
      children: <UserRoleTab />
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
