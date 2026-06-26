import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Badge, Popover, List, message } from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  KeyOutlined, 
  ShoppingCartOutlined, 
  AppstoreOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  MessageOutlined,
  BellOutlined,
  FolderOutlined,
  StarOutlined,
  NotificationOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import moment from 'moment';
import http from '@/apis/http';

moment.locale('vi');

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
    if (path.includes('/admin/vouchers')) return 'vouchers';
    if (path.includes('/admin/products')) return 'products';
    if (path.includes('/admin/wallets')) return 'wallets';
    if (path.includes('/admin/shipping-fees')) return 'shipping-fees';
    if (path.includes('/admin/chat')) return 'chat';
    if (path.includes('/admin/reviews')) return 'reviews';
    if (path.includes('/admin/promotions')) return 'promotions';
    if (path.includes('/admin/disputes')) return 'disputes';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getSelectedKey());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setActiveTab(getSelectedKey());
  }, [location.pathname]);

  useEffect(() => {
    fetchNotifications();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/hubs/notification`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    connection.start().catch(err => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveNotification', (notification) => {
      if (notification.type === 'System') {
        setNotifications(prev => [notification, ...prev]);
        // Bắn sự kiện ra ngoài để các trang con có thể lắng nghe
        window.dispatchEvent(new CustomEvent('admin-receive-notification', { detail: notification }));
      }
    });

    return () => {
      connection.stop();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await http.get('/api/Notification');
      setNotifications(res.data.filter((n: any) => n.type === 'System'));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await http.put(`/api/Notification/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await http.put(`/api/Notification/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const notificationContent = (
    <div className="w-80 max-h-96 flex flex-col">
      <div className="flex justify-end mb-2">
        <span className="text-blue-500 cursor-pointer text-xs hover:underline" onClick={markAllAsRead}>
          Đánh dấu tất cả đã đọc
        </span>
      </div>
      <div className="overflow-y-auto flex-1">
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(item: any) => (
            <List.Item 
              className={`cursor-pointer hover:bg-gray-50 transition-colors p-2 rounded-lg ${!item.isRead ? 'bg-blue-50/50' : ''}`}
              onClick={() => {
                if (!item.isRead) markAsRead(item.id);
                if (item.type === 'System' && item.relatedId) {
                  setIsPopoverOpen(false);
                  navigate('/admin/orders', { state: { highlightOrderId: item.relatedId } });
                  setActiveTab('orders');
                }
              }}
            >
              <List.Item.Meta
                avatar={<BellOutlined className={!item.isRead ? "text-blue-500 mt-2" : "text-gray-400 mt-2"} />}
                title={<span className={`text-sm ${!item.isRead ? 'font-bold' : 'font-normal'}`}>{item.title}</span>}
                description={
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-600 line-clamp-2">{item.message}</span>
                    <span className="text-[10px] text-gray-400">{moment(item.createdAt).fromNow()}</span>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Không có thông báo nào' }}
        />
      </div>
    </div>
  );

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: 'users', icon: <UserOutlined />, label: 'Quản lý tài khoản' },
    { key: 'roles', icon: <KeyOutlined />, label: 'Quản lý phân quyền' },
    { key: 'categories', icon: <FolderOutlined />, label: 'Quản lý danh mục' },
    { key: 'products', icon: <AppstoreOutlined />, label: 'Quản lý sản phẩm' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Quản lý đơn hàng' },
    { key: 'vouchers', icon: <DollarOutlined />, label: 'Quản lý Voucher' },
    { key: 'wallets', icon: <DollarOutlined />, label: 'Quản lý dòng tiền' },
    { key: 'shipping-fees', icon: <ShoppingCartOutlined />, label: 'Quản lý phí ship' },
    { key: 'reviews', icon: <StarOutlined />, label: 'Quản lý đánh giá' },
    { key: 'promotions', icon: <NotificationOutlined />, label: 'Banner & Khuyến mãi' },
    { key: 'disputes', icon: <ExclamationCircleOutlined />, label: 'Quản lý khiếu nại' },
    { key: 'chat', icon: <MessageOutlined />, label: 'Hỗ trợ khách hàng' },
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
    <Layout className='min-h-screen bg-[#f3f4f6] font-sans'>
      <Sider 
        width={260} 
        theme='dark' 
        className='shadow-xl z-20' 
        style={{ backgroundColor: '#1e293b', overflow: 'auto', height: '100vh', position: 'sticky', top: 0, left: 0 }}
      >
        <div className='h-[72px] flex items-center justify-center bg-[#0f172a] border-b border-gray-800'>
          <Title level={4} className='mb-0! font-bold mt-2 tracking-wide' style={{ color: '#60a5fa' }}>
            QUẢN TRỊ HỆ THỐNG
          </Title>
        </div>
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[activeTab]}
          items={menuItems}
          onClick={handleMenuClick}
          className='py-4 bg-[#1e293b] [&_.ant-menu-item-selected]:bg-blue-600 [&_.ant-menu-item-selected]:text-white [&_.ant-menu-item-selected]:shadow-md [&_.ant-menu-item]:rounded-xl [&_.ant-menu-item]:mx-3 [&_.ant-menu-item]:mb-1 font-medium overflow-y-auto h-[calc(100vh-72px)]'
          style={{ backgroundColor: '#1e293b' }}
        />
      </Sider>

      <Layout className='bg-transparent'>
        <Header 
          className='backdrop-blur-md px-8 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b border-gray-200 h-[72px] leading-[72px]'
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
        >
          <Title level={5} className='mb-0! text-gray-700 font-semibold'>Trang quản trị hệ thống E-Commerce</Title>
          <div className="flex items-center gap-6 h-full">
            <Popover placement="bottomRight" title={<span className="font-bold text-gray-800">Thông báo mới</span>} content={notificationContent} trigger="click" open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <Badge count={unreadCount} overflowCount={99} className="cursor-pointer flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm">
                  <BellOutlined className="text-xl text-blue-600" />
                </div>
              </Badge>
            </Popover>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 h-10">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                 A
               </div>
               <span className="font-semibold text-gray-700">Admin</span>
            </div>
          </div>
        </Header>
        <Content className='p-8 min-h-[280px]'>
          <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-full'>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
