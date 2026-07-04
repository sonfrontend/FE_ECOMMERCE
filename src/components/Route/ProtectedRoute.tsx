import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ role }: { role?: string }) {
  const accessToken = localStorage.getItem('accessToken');
  if(role && role.includes('Admin')) {
    const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const isAdmin = userInfo?.roles?.includes('Admin');
  if (!isAdmin) {
    return <Navigate to='/' replace />;
  }
  }

  if (!accessToken) {
    return <Navigate to='/' replace />;
  }

  return <Outlet />;
}
