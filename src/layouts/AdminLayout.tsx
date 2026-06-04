import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  KeyOutlined, 
  ShoppingCartOutlined, 
  AppstoreOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Highlight menu based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/roles')) return 'roles';
    if (path.includes('/admin/orders')) return 'orders';
    if (path.includes('/admin/products')) return 'products';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getSelectedKey());

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: 'users', icon: <UserOutlined />, label: 'Quản lý tài khoản' },
    { key: 'roles', icon: <KeyOutlined />, label: 'Quản lý phân quyền' },
    { key: 'products', icon: <AppstoreOutlined />, label: 'Quản lý sản phẩm' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Quản lý đơn hàng' },
    { type: 'divider' as const },
    { key: 'back', icon: <ArrowLeftOutlined />, label: 'Về trang bán hàng' }
  ];

  const handleMenuClick = (e: any) => {
    if (e.key === 'back') {
      navigate('/');
      return;
    }
    setActiveTab(e.key);
    if (e.key === 'dashboard') navigate('/admin');
    else navigate(`/admin/${e.key}`);
  };

  return (
    <Layout className='min-h-screen'>
      <Sider width={250} theme='dark' className='shadow-md'>
        <div className='h-[64px] flex items-center justify-center bg-gray-900'>
          <Title level={4} className='mb-0! text-white! mt-2'>
            ADMIN PANEL
          </Title>
        </div>
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[activeTab]}
          items={menuItems}
          onClick={handleMenuClick}
          className='h-[calc(100vh-64px)] overflow-y-auto pt-4'
        />
      </Sider>

      <Layout>
        <Header className='bg-white px-6 flex items-center shadow-sm'>
          <Title level={5} className='mb-0!'>Trang quản trị hệ thống E-Commerce</Title>
        </Header>
        <Content className='p-6 bg-gray-50 min-h-[280px]'>
          <div className='bg-white p-6 rounded-lg shadow-sm min-h-full'>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
