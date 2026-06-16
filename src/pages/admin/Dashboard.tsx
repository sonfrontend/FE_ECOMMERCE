import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, message, Table, Tag } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  ExclamationCircleOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import http from '@/apis/http';
import moment from 'moment';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const { Title, Text } = Typography;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProductsSold: 0,
    totalProductsLost: 0,
    topSellingCategory: 'Đang tải...',
    topSellingProduct: 'Đang tải...'
  });
  
  const [pendingDisputes, setPendingDisputes] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const [revenueLabels, setRevenueLabels] = useState<string[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [orderStatusLabels, setOrderStatusLabels] = useState<string[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<number[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, revenueRes, orderRes, productsRes, ordersListRes, disputesRes] = await Promise.allSettled([
        http.get('/api/AdminStatistic/dashboard-summary'),
        http.get('/api/AdminStatistic/revenue'),
        http.get('/api/AdminStatistic/order-status'),
        http.get('/api/Product'),
        http.get('/api/AdminOrder'),
        http.get('/api/Dispute')
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
      
      if (revenueRes.status === 'fulfilled') {
        const rData = revenueRes.value.data.data || revenueRes.value.data.Data;
        if (rData) {
            setRevenueLabels(rData.map((d: any) => d.month || d.Month));
            setRevenueData(rData.map((d: any) => d.revenue || d.Revenue));
        }
      }

      if (orderRes.status === 'fulfilled') {
        const oData = orderRes.value.data.data || orderRes.value.data.Data;
        if (oData) {
            const statusMap: Record<string, string> = {
            'PendingPayment': 'Chưa thanh toán',
            'Pending': 'Đã đặt',
            'Processing': 'Đang chuẩn bị',
            'Shipped': 'Đang giao',
            'Completed': 'Đã hoàn thành',
            'Cancelled': 'Đã hủy',
            'Refunded': 'Hoàn tiền'
            };
            setOrderStatusLabels(oData.map((d: any) => statusMap[d.status || d.Status] || d.status || d.Status));
            setOrderStatusData(oData.map((d: any) => d.count || d.Count));
        }
      }

      if (productsRes.status === 'fulfilled') {
        let prods = productsRes.value.data;
        if (prods.data) prods = prods.data;
        if (prods && Array.isArray(prods)) {
            prods = prods.sort((a: any, b: any) => (b.soldQuantity || 0) - (a.soldQuantity || 0)).slice(0, 5);
            setTopProducts(prods);
        }
      }

      if (ordersListRes.status === 'fulfilled') {
        let ords = ordersListRes.value.data;
        if (ords.data) ords = ords.data;
        if (ords && Array.isArray(ords)) setRecentOrders(ords.slice(0, 5));
      }

      if (disputesRes.status === 'fulfilled') {
        const disputes = disputesRes.value.data;
        if (disputes && Array.isArray(disputes)) {
            const pending = disputes.filter((d: any) => d.status === 'Pending').length;
            setPendingDisputes(pending);
        }
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spin size="large" tip="Đang tải dữ liệu..." /></div>;

  const lineChartData = {
    labels: revenueLabels,
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: revenueData,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      fill: true,
      tension: 0.4
    }],
  };

  const pieChartData = {
    labels: orderStatusLabels,
    datasets: [{
      label: 'Số lượng đơn',
      data: orderStatusData,
      backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b'],
      borderWidth: 0,
    }],
  };

  const barChartData = {
    labels: topProducts.map(p => {
        const name = p.productName || p.ProductName || 'Unknown';
        return name.length > 15 ? name.substring(0, 15) + '...' : name;
    }),
    datasets: [{
      label: 'Đã bán',
      data: topProducts.map(p => p.soldQuantity || p.SoldQuantity || 0),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 4
    }]
  };

  const orderColumns = [
    { title: 'Mã ĐH', dataIndex: 'id', key: 'id', render: (id: any) => <span className="font-semibold text-blue-600">#{id}</span> },
    { title: 'Khách hàng', dataIndex: 'recipientName', key: 'recipientName' },
    { title: 'Ngày đặt', dataIndex: 'orderDate', key: 'orderDate', render: (date: any) => moment(date).format('DD/MM/YYYY HH:mm') },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', render: (amount: any) => <span className="font-bold">{formatCurrency(amount)}</span> },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'Completed' || status === 'Delivered') color = 'success';
        if (status === 'Cancelled') color = 'error';
        if (status === 'PendingPayment') color = 'warning';
        if (status === 'Pending' || status === 'Processing') color = 'processing';
        return <Tag color={color}>{status}</Tag>;
      }
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <Title level={3} className='mb-1 text-gray-800'>Tổng quan kinh doanh</Title>
          <Text className="text-gray-500">Cập nhật lúc {moment().format('HH:mm - DD/MM/YYYY')}</Text>
        </div>
      </div>
      
      {/* STAT CARDS */}
      <Row gutter={[24, 24]} className='mb-8'>
        {/* Row 1 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Tổng tiền đã nhận</span>} value={summary.totalRevenue || summary.TotalRevenue || 0} suffix="₫" valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><DollarOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Số người dùng (User)</span>} value={summary.totalUsers || summary.TotalUsers || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><UserOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Số lượt bán</span>} value={summary.totalOrders || summary.TotalOrders || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><ShoppingCartOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Số sản phẩm đã bán</span>} value={summary.totalProductsSold || summary.TotalProductsSold || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><AppstoreOutlined /></div>
          </Card>
        </Col>
        
        {/* Row 2 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Số SP thất lạc</span>} value={summary.totalProductsLost || summary.TotalProductsLost || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><CloseCircleOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Loại SP bán nhiều nhất</span>} value={summary.topSellingCategory || summary.TopSellingCategory || 'Trống'} valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><FireOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">SP mua nhiều nhất</span>} value={summary.topSellingProduct || summary.TopSellingProduct || 'Trống'} valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><StarOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 overflow-hidden relative">
            <Statistic title={<span className="text-white/80 font-medium">Khiếu nại đang chờ</span>} value={pendingDisputes} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-white/20 text-4xl"><ExclamationCircleOutlined /></div>
          </Card>
        </Col>
      </Row>

      {/* CHARTS */}
      <Row gutter={[24, 24]} className='mb-8'>
        <Col xs={24} lg={16}>
          <Card title={<span className="font-bold text-gray-700">Doanh thu năm nay</span>} bordered={false} className="shadow-sm rounded-2xl h-[420px]">
            <div className="w-full h-full relative pb-10">
              <Line options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} data={lineChartData} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span className="font-bold text-gray-700">Trạng thái đơn hàng</span>} bordered={false} className="shadow-sm rounded-2xl h-[420px]">
             <div className="w-full h-full relative pb-10 flex justify-center items-center">
              <Pie options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} data={pieChartData} />
             </div>
          </Card>
        </Col>
      </Row>

      {/* RECENT ORDERS & TOP PRODUCTS */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title={<span className="font-bold text-gray-700">Đơn hàng mới nhất</span>} bordered={false} className="shadow-sm rounded-2xl">
            <Table 
              dataSource={recentOrders} 
              columns={orderColumns} 
              rowKey="id" 
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span className="font-bold text-gray-700">Top 5 SP Bán chạy</span>} bordered={false} className="shadow-sm rounded-2xl">
            <div className="h-[300px]">
              <Bar options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y' as const, plugins: { legend: { display: false } } }} data={barChartData} />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
