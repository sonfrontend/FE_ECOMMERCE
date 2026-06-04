import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { message } from 'antd';
import { jwtDecode } from 'jwt-decode'; // 🎯 GỌI THƯ VIỆN RA

const AdminRoute: React.FC = () => {
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  // Kiểm tra xem có phải Admin không (Tùy vào cách bạn đặt tên thuộc tính trong C#)
  const isAdmin = userInfo?.roles?.includes('Admin') ;

  if (isAdmin) {
    message.error('Bạn không có quyền truy cập trang này!');
    // Đá về trang chủ nếu không phải Admin
    return <Navigate to="/" replace />;
  }
  
  // Nếu là Admin -> Cho phép đi tiếp vào trang con
  return <Outlet />;
};

export default AdminRoute;