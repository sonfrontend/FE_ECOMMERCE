import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 🎯 GỌI THƯ VIỆN RA

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

  try {
    const decodedToken = jwtDecode(accessToken);
    // eslint-disable-next-line react-hooks/purity
    const isTokenExpired = decodedToken.exp < Date.now() / 1000;
    if (isTokenExpired) {
      localStorage.removeItem('token');
      return <Navigate to='/' replace />;
    }
  } catch {
    localStorage.removeItem('token');
    return <Navigate to='/' replace />;
  }
  return <Outlet />;
}
