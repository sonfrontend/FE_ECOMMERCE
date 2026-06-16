import AuthLayout from '@/layouts/AuthLayout';
import { lazy } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

const Login = lazy(() => import('@/pages/auths/Login'));
const Register = lazy(() => import('@/pages/auths/Register'));
const Manager = lazy(() => import('@/pages/manage/Manage'));
const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const ProtectedRoute = lazy(() => import('@/components/Route/ProtectedRoute'));
const AdminRoute = lazy(() => import('@/components/Route/AdminRoute'));

const Home = lazy(() => import('@/pages/Home/Home'));
const ProductDetail = lazy(() => import('@/pages/Product/ProductDetail'));
const CategoryProducts = lazy(() => import('@/pages/Product/CategoryProducts'));

const Cart = lazy(() => import('@/pages/Cart/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout/Checkout'));
const OrderHistory = lazy(() => import('@/pages/Order/OrderHistory'));
const VnpayReturn = lazy(() => import('@/pages/Payment/VnpayReturn'));

// Admin Imports
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProductManage = lazy(() => import('@/pages/admin/AdminProductManage'));
const AdminUserManage = lazy(() => import('@/pages/admin/AdminUserManage'));
const RoleManage = lazy(() => import('@/pages/admin/RoleManage/RoleManage'));
const OrderManage = lazy(() => import('@/pages/admin/AdminOrderManage'));
const AdminPaymentManage = lazy(() => import('@/pages/admin/AdminPaymentManage'));
const AdminWalletManage = lazy(() => import('@/pages/admin/AdminWalletManage'));
const AdminVoucherManage = lazy(() => import('@/pages/admin/AdminVoucherManage'));
const ShippingFeeManage = lazy(() => import('@/pages/admin/AdminShippingFeeManage'));
const AdminChatManage = lazy(() => import('@/pages/admin/AdminChatManage'));

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
      element: <MainLayout />,
      children: [
        {
          path: '',
          element: <Home />
        },
        {
          path: 'category/:id',
          element: <CategoryProducts mode="category" />
        },
        {
          path: 'search',
          element: <CategoryProducts mode="search" />
        },
        {
          path: 'flash-sale',
          element: <CategoryProducts mode="flash-sale" />
        },
        // Các trang yêu cầu đăng nhập
        {
          path: '',
          element: <ProtectedRoute />,
          children: [
            {
              path: 'product/:id',
              element: <ProductDetail />
            },
            {
              path: 'cart',
              element: <Cart />
            },
            {
              path: 'checkout',
              element: <Checkout />
            },
            {
              path: 'history',
              element: <OrderHistory />
            },
            {
              path: 'payment/vnpay-return',
              element: <VnpayReturn />
            }
          ]
        }
      ]
    },
    {
      path: '/admin',
      element:  <ProtectedRoute role='Admin' />, // Bảo vệ route admin
      children: [
        {
          path: '',
          element: <AdminLayout />,
          children: [
            {
              path: '',
              element: <AdminDashboard />
            },
            {
              path: 'products',
              element: <AdminProductManage />
            },
            {
              path: 'users',
              element: <AdminUserManage />
            },
            {
              path: 'roles',
              element: <RoleManage />
            },
            {
              path: 'orders',
              element: <OrderManage />
            },
            {
              path: 'vouchers',
              element: <AdminVoucherManage />
            },
            {
              path: 'payments',
              element: <AdminPaymentManage />
            },
            {
              path: 'wallets',
              element: <AdminWalletManage />
            },
            {
              path: 'shipping-fees',
              element: <ShippingFeeManage />
            },
            {
              path: 'chat',
              element: <AdminChatManage />
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
