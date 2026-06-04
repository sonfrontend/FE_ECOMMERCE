import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, message } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  AppstoreOutlined 
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import http from '@/apis/http';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const { Title } = Typography;

interface SummaryData {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalProductsSold: number;
}

const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#0088FE']; // Xanh lá, Đỏ cam, Vàng, Xanh dương

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProductsSold: 0
  });
  
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
      try {
        const [summaryRes, revenueRes, orderRes] = await Promise.all([
          http.get('/api/AdminStatistic/dashboard-summary'),
          http.get('/api/AdminStatistic/revenue'),
          http.get('/api/AdminStatistic/order-status')
        ]);
        
        setSummary(summaryRes.data);
        
        const rData = revenueRes.data.data;
        setRevenueLabels(rData.map((d: any) => d.month));
        setRevenueData(rData.map((d: any) => d.revenue));

        const oData = orderRes.data.data;
        const statusMap: Record<string, string> = {
          'PendingPayment': 'Chờ thanh toán',
          'Pending': 'Đã đặt / Chờ xác nhận',
          'Processing': 'Đang chuẩn bị',
          'Shipped': 'Đang giao',
          'Completed': 'Đã hoàn thành',
          'Cancelled': 'Đã hủy',
          'Refunded': 'Hoàn tiền'
        };
        setOrderStatusLabels(oData.map((d: any) => statusMap[d.status] || d.status));
        setOrderStatusData(oData.map((d: any) => d.count));
      } catch (error) {
        message.warning('Không thể kết nối API Thống kê, đang hiển thị dữ liệu mẫu.');
        setSummary({
          totalUsers: 150,
          totalProducts: 320,
          totalOrders: 85,
          totalRevenue: 150000000,
          totalProductsSold: 450
        });
        
        setRevenueLabels(['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5']);
        setRevenueData([40000000, 30000000, 50000000, 27000000, 60000000]);

        setOrderStatusLabels(['Đã bán', 'Đã hủy', 'Đang chờ xử lý', 'Chưa thanh toán']);
        setOrderStatusData([400, 50, 100, 30]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  const lineChartData = {
    labels: revenueLabels,
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: revenueData,
        borderColor: '#8884d8',
        backgroundColor: 'rgba(136, 132, 216, 0.5)',
      },
    ],
  };

  const pieChartData = {
    labels: orderStatusLabels,
    datasets: [
      {
        label: 'Số lượng đơn',
        data: orderStatusData,
        backgroundColor: COLORS,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <Title level={3} className='mb-6'>Tổng quan kinh doanh</Title>
      
      <Row gutter={[16, 16]} className='mb-8'>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Tổng doanh thu" value={summary.totalRevenue} prefix={<DollarOutlined />} suffix="VNĐ" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Sản phẩm đã bán" value={summary.totalProductsSold} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Khách hàng" value={summary.totalUsers} prefix={<UserOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic title="Tổng Sản phẩm" value={summary.totalProducts} prefix={<AppstoreOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Biểu đồ doanh thu 2026" bordered={false} className="shadow-sm h-[400px]">
            <div className="w-full h-full relative pb-10">
              <Line options={{ responsive: true, maintainAspectRatio: false }} data={lineChartData} />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Trạng thái đơn hàng" bordered={false} className="shadow-sm h-[400px]">
             <div className="w-full h-full relative pb-10 flex justify-center">
              <Pie data={pieChartData} />
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
