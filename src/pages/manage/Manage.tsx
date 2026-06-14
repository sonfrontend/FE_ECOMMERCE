import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { UserOutlined, ArrowLeftOutlined, KeyOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';
import AccountManage from './AccountManage';
import RoleManage from '../admin/RoleManage/RoleManage';
import OrderManage from '../admin/OrderManage';
import OrderHistory from '../Order/OrderHistory';
import UserVoucherManage from './UserVoucherManage';
import { GiftOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;
const { Title } = Typography;

export default function Manager() {
  const [activeTab, setActiveTab] = useState('1');

  // Menu items config
  const menuItems: MenuProps['items'] = [
    { key: '1', icon: <UserOutlined />, label: 'Quản lý tài khoản' },
    { key: '2', icon: <ShoppingCartOutlined />, label: 'Quản lý đơn hàng' },
    { key: '3', icon: <GiftOutlined />, label: 'Quản lý voucher' },
    { key: 'back', icon: <ArrowLeftOutlined />, label: <Link to='/'>Về trang chủ</Link> }
  ];

  /* ------------------- RENDER ------------------- */

  return (
    <Layout className='min-h-screen'>
      <Sider width={250} theme='light' className='shadow-md'>
        <div className='h-[64px] flex items-center justify-center'>
          <Title level={4} className='mb-0! text-primary'>
            QUẢN LÝ
          </Title>
        </div>
        <Menu
          mode='inline'
          selectedKeys={[activeTab]}
          items={menuItems}
          onClick={(e) => {
            if (e.key !== 'back') setActiveTab(e.key);
          }}
          className='h-[calc(100vh-64px)] overflow-y-auto'
        />
      </Sider>

      <Layout className='p-6'>
        <Content className='bg-transparent'>
          {/* TAB 1: Quản lý tài khoản */}
          {activeTab === '1' && <AccountManage />}
          {/* TAB 2: Quản lý đơn hàng */}
          {activeTab === '2' && (
            <div className='-mt-8 -mx-4'>
              <OrderHistory />
            </div>
          )}
          {/* TAB 3: Quản lý voucher */}
          {activeTab === '3' && <UserVoucherManage setActiveTab={setActiveTab} />}
        </Content>
      </Layout>
    </Layout>
  );
}
