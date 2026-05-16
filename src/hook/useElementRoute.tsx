import AuthLayout from '@/layouts/AuthLayout';
import { lazy } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

const Login = lazy(() => import('@/pages/auths/Login'));
const Register = lazy(() => import('@/pages/auths/Register'));
const Manager = lazy(() => import('@/pages/manage/Manage'));
const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const ProtectedRoute = lazy(() => import('@/components/Route/ProtectedRoute'));

const Home = lazy(() => import('@/pages/Home/Home'));
const ProductDetail = lazy(() => import('@/pages/Product/ProductDetail'));

const Search = lazy(() => import('@/pages/Search/Search'));

export default function useRouteElements() {
  const routeElements = useRoutes([
    {
      path: '/login',
      element: (
        <AuthLayout>
          <Login></Login>
        </AuthLayout>
      )
    },
    {
      path: '/register',
      element: (
        <AuthLayout>
          <Register></Register>
        </AuthLayout>
      )
    },
    {
      path: '/manage',
      element: <Manager />
    },
    {
      path: '/',
      element: <ProtectedRoute />, // Đặt anh bảo vệ đứng ngay cửa chính
      children: [
        // Bất cứ trang nào nhét vào cái mảng children này
        // đều sẽ được rót vào cái thẻ <Outlet /> của ProtectedRoute
        {
          path: '', // Tương đương với link gốc '/'
          element: <MainLayout />,
          children: [
            {
              path: '',
              element: <Home />
            },
            {
              path: 'product/:id',
              element: <ProductDetail />
            },
            {
              path: 'search',
              element: <Search />
            }
          ]
        }
      ]
    },

    {
      path: '*',
      element: <Navigate to='/' replace /> // Đá về trang chủ (trang chủ lại bị Trạm gác xét hỏi tiếp)
    }
  ]);
  return routeElements;
}
