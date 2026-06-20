import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Avatar } from 'antd';
import { UserOutlined, ArrowLeftOutlined, KeyOutlined, ShoppingCartOutlined, GiftOutlined, EnvironmentOutlined, HeartOutlined, StarOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import AccountManage from './AccountManage';
import RoleManage from '../admin/RoleManage/RoleManage';
import OrderManage from '../admin/AdminOrderManage';
import OrderHistory from '../Order/OrderHistory';
import UserVoucherManage from './UserVoucherManage';
import AddressManage from './AddressManage';
import FavoriteManage from './FavoriteManage';
import ReviewManage from './ReviewManage';
import Cart from '../Cart/Cart';

const { Title, Text } = Typography;

export default function Manager() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || '1');
  const [userInfo, setUserInfo] = useState<any>({});

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserInfo(JSON.parse(localStorage.getItem('userInfo') || '{}'));
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const menuItems: MenuProps['items'] = [
    { key: '1', icon: <UserOutlined />, label: 'Hồ sơ của tôi' },
    { key: '4', icon: <EnvironmentOutlined />, label: 'Địa chỉ nhận hàng' },
    { key: '2', icon: <ShoppingCartOutlined />, label: 'Đơn mua' },
    { key: '7', icon: <ShoppingCartOutlined />, label: 'Giỏ hàng' },
    { key: '3', icon: <GiftOutlined />, label: 'Kho Voucher' },
    { key: '5', icon: <HeartOutlined />, label: 'Yêu thích' },
    { key: '6', icon: <StarOutlined />, label: 'Đánh giá' },
    { type: 'divider' as any },
    { key: 'back', icon: <ArrowLeftOutlined />, label: <Link to='/'>Trở về mua sắm</Link> }
  ];

  return (
    <div className='min-h-screen bg-gray-50 flex justify-center py-10 px-4 font-sans'>
      <div className='max-w-[1200px] w-full flex flex-row gap-6'>
        {/* Sidebar */}
        <div className='w-[260px] flex-shrink-0'>
          <div className='bg-white rounded-2xl shadow-sm overflow-hidden sticky top-6 border border-gray-100'>
            <div className='p-6 flex items-center gap-4 border-b border-gray-100 bg-gradient-to-br from-blue-50/80 to-white'>
              <Avatar size={52} icon={<UserOutlined />} src={userInfo.avatar} className="bg-blue-500 border-2 border-white shadow-sm flex-shrink-0" />
              <div className='flex flex-col min-w-0'>
                <Text className='text-xs text-gray-500 font-medium'>Tài khoản của</Text>
                <Text className='font-bold text-gray-800 text-base truncate'>{userInfo.fullName || userInfo.userName || 'Bạn'}</Text>
              </div>
            </div>
            <div className="py-2">
              <Menu
                mode='inline'
                selectedKeys={[activeTab]}
                items={menuItems}
                onClick={(e) => {
                  if (e.key !== 'back') setActiveTab(e.key);
                }}
                className='border-r-0 border-none px-2 custom-user-menu [&_.ant-menu-item-selected]:bg-blue-50 [&_.ant-menu-item-selected]:text-blue-600 [&_.ant-menu-item-selected]:font-semibold [&_.ant-menu-item]:rounded-lg [&_.ant-menu-item]:h-11 [&_.ant-menu-item]:!pl-4 [&_.ant-menu-item]:!pr-4 [&_.ant-menu-title-content]:text-left'
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 bg-white rounded-2xl shadow-sm min-h-[600px] border border-gray-100'>
          {activeTab === '1' && <AccountManage />}
          {activeTab === '2' && <div className='-mt-8 rounded-2xl overflow-hidden'><OrderHistory /></div>}
          {activeTab === '7' && <div className='rounded-2xl overflow-hidden'><Cart isEmbedded={true} /></div>}
          {activeTab === '3' && <div className='p-8'><UserVoucherManage setActiveTab={setActiveTab} /></div>}
          {activeTab === '4' && <div className='p-8'><AddressManage /></div>}
          {activeTab === '5' && <div className='p-8'><FavoriteManage /></div>}
          {activeTab === '6' && <div className='p-8'><ReviewManage /></div>}
        </div>
      </div>
    </div>
  );
}
