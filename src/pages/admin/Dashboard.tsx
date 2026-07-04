import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, message, Table, Tag, Button, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  ExclamationCircleOutlined,
  AppstoreOutlined,
  CloseCircleOutlined,
  FireOutlined,
  StarOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx-js-style';
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
import dayjs from 'dayjs';
import { getImageUrl } from '@/utils/imageUrl';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[any, any]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
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
  
  const [disputedOrdersCount, setDisputedOrdersCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [lostProducts, setLostProducts] = useState<any[]>([]);

  const [revenueLabels, setRevenueLabels] = useState<string[]>([]);
  const [revenueData, setRevenueData] = useState<number[]>([]);
  const [orderStatusLabels, setOrderStatusLabels] = useState<string[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<number[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const start = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
      const end = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
      const query = `?startDate=${start}&endDate=${end}`;

      const [summaryRes, revenueRes, orderRes, productsRes, ordersListRes, disputesRes, lowStockRes, lostProductsRes] = await Promise.allSettled([
        http.get(`/api/AdminStatistic/dashboard-summary${query}`),
        http.get(`/api/AdminStatistic/revenue${query}`),
        http.get(`/api/AdminStatistic/order-status${query}`),
        http.get('/api/Product?sortBy=best_selling&pageSize=100'),
        http.get('/api/Order/admin'),
        http.get('/api/Dispute/admin/complaints'),
        http.get('/api/AdminStatistic/low-stock'),
        http.get(`/api/AdminStatistic/lost-products${query}`)
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
        if (prods.items) prods = prods.items;
        else if (prods.Items) prods = prods.Items;
        else if (prods.data) prods = prods.data;
        else if (prods.Data) prods = prods.Data;
        
        if (prods && Array.isArray(prods)) {
            const sortedProds = [...prods]
              .filter((p: any) => (p.soldQuantity || p.SoldQuantity || 0) > 0)
              .sort((a: any, b: any) => (b.soldQuantity || b.SoldQuantity || 0) - (a.soldQuantity || a.SoldQuantity || 0))
              .slice(0, 10);
            setTopProducts(sortedProds);
        }
      }

      if (lowStockRes.status === 'fulfilled') {
        let lowStock = lowStockRes.value.data;
        if (lowStock.data) lowStock = lowStock.data;
        if (lowStock.Data) lowStock = lowStock.Data;
        if (lowStock && Array.isArray(lowStock)) {
            setLowStockProducts(lowStock);
        }
      }

      if (ordersListRes.status === 'fulfilled') {
        let ords = ordersListRes.value.data;
        if (ords && ords.data) ords = ords.data;
        if (ords && Array.isArray(ords)) setRecentOrders(ords.slice(0, 5));
      }

      if (disputesRes.status === 'fulfilled') {
        const disputes = disputesRes.value.data;
        if (disputes && Array.isArray(disputes)) {
            setDisputedOrdersCount(disputes.length);
        }
      }

      if (lostProductsRes.status === 'fulfilled') {
        let lost = lostProductsRes.value.data;
        if (lost && Array.isArray(lost)) {
            setLostProducts(lost);
        }
      }
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spin size="large" tip="Đang tải dữ liệu..." /></div>;

  const exportToExcel = () => {
    // 1. Tổng quan
    const summaryData = [
      { 'Chỉ số': 'Thời gian thống kê', 'Giá trị': `Từ ${dateRange[0].format('DD/MM/YYYY')} đến ${dateRange[1].format('DD/MM/YYYY')}` },
      { 'Chỉ số': 'Tổng người dùng', 'Giá trị': summary.totalUsers },
      { 'Chỉ số': 'Tổng sản phẩm', 'Giá trị': summary.totalProducts },
      { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': summary.totalOrders },
      { 'Chỉ số': 'Tổng doanh thu', 'Giá trị': formatCurrency(summary.totalRevenue) },
      { 'Chỉ số': 'Tổng SP đã bán', 'Giá trị': summary.totalProductsSold },
      { 'Chỉ số': 'Tổng SP thất lạc', 'Giá trị': summary.totalProductsLost },
      { 'Chỉ số': 'Danh mục bán chạy', 'Giá trị': summary.topSellingCategory },
      { 'Chỉ số': 'Sản phẩm bán chạy', 'Giá trị': summary.topSellingProduct }
    ];

    // 2. Doanh thu
    const revenueSheetData = revenueLabels.map((label, i) => ({
      'Tháng': label,
      'Doanh thu (VNĐ)': revenueData[i]
    }));

    // 3. Sản phẩm bán chạy
    const topProductsData = topProducts.map(p => ({
      'Mã SP': p.id || p.Id,
      'Tên sản phẩm': p.productName || p.ProductName,
      'Đã bán': p.soldQuantity || p.SoldQuantity,
      'Đánh giá trung bình': p.averageRating || p.AverageRating || 0
    }));

    // 4. Sắp hết hàng
    const lowStockData = lowStockProducts.map(p => ({
      'Mã biến thể': p.productId,
      'Tên sản phẩm': p.productName,
      'Tồn kho': p.stockQuantity,
      'Đã bán': p.soldQuantity,
      'Giá gốc': p.originalPrice
    }));

    // 5. Sản phẩm thất lạc
    const lostProductsData = lostProducts.map(p => ({
      'Mã ĐH': p.orderId,
      'Ngày đặt': dayjs(p.orderDate).format('DD/MM/YYYY HH:mm'),
      'Tên sản phẩm': p.productName,
      'Số lượng': p.quantity,
      'Đơn giá': p.price,
      'Tổng tiền': p.total
    }));

    // 6. Đơn hàng gần đây
    const recentOrdersData = recentOrders.map(o => ({
      'Mã ĐH': o.id || o.Id,
      'Ngày đặt': dayjs(o.orderDate || o.OrderDate).format('DD/MM/YYYY HH:mm'),
      'Khách hàng': (o.user || o.User)?.fullName || (o.user || o.User)?.username || 'Khách',
      'Tổng tiền': o.totalAmount || o.TotalAmount,
      'Trạng thái': o.status || o.Status,
      'Thanh toán': (o.paymentMethod || o.PaymentMethod) === 'COD' ? 'Thanh toán khi nhận hàng' : 'PayPal'
    }));

    const wb = XLSX.utils.book_new();
    
    const styleWorksheet = (ws: any) => {
      const range = XLSX.utils.decode_range(ws['!ref']!);
      const colWidths: {wch: number}[] = [];
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let max_width = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
          const cell = ws[cell_ref];
          
          if (!cell) continue;
          
          const text_len = cell.v ? cell.v.toString().length : 0;
          if (text_len > max_width) {
            max_width = text_len;
          }
          
          // Style Header row
          if (R === 0) {
            cell.s = {
              font: { bold: true },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
        }
        colWidths.push({ wch: max_width + 4 }); // add padding
      }
      ws['!cols'] = colWidths;
      return ws;
    };

    XLSX.utils.book_append_sheet(wb, styleWorksheet(XLSX.utils.json_to_sheet(summaryData)), "Tổng quan");
    XLSX.utils.book_append_sheet(wb, styleWorksheet(XLSX.utils.json_to_sheet(revenueSheetData)), "Doanh thu");
    XLSX.utils.book_append_sheet(wb, styleWorksheet(XLSX.utils.json_to_sheet(topProductsData)), "Sản phẩm bán chạy");
    XLSX.utils.book_append_sheet(wb, styleWorksheet(XLSX.utils.json_to_sheet(lowStockData)), "Sắp hết hàng");
    XLSX.utils.book_append_sheet(wb, styleWorksheet(XLSX.utils.json_to_sheet(lostProductsData)), "Sản phẩm thất lạc");
    XLSX.utils.book_append_sheet(wb, styleWorksheet(XLSX.utils.json_to_sheet(recentOrdersData)), "Đơn hàng gần đây");

    const startDateStr = dateRange[0].format('DD_MM_YYYY');
    const endDateStr = dateRange[1].format('DD_MM_YYYY');
    const fileName = `Bao_Cao_Thong_Ke_Tu_${startDateStr}_Den_${endDateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

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
    { title: 'Mã ĐH', key: 'id', render: (_: any, r: any) => <span className="font-semibold text-blue-600">#{r.id || r.Id}</span> },
    { title: 'Khách hàng', key: 'recipientName', render: (_: any, r: any) => <span>{r.recipientName || r.RecipientName}</span> },
    { title: 'Ngày đặt', key: 'orderDate', render: (_: any, r: any) => <span>{dayjs(r.orderDate || r.OrderDate).format('DD/MM/YYYY HH:mm')}</span> },
    { title: 'Tổng tiền', key: 'totalAmount', render: (_: any, r: any) => <span className="font-bold">{formatCurrency(r.totalAmount || r.TotalAmount || 0)}</span> },
    { 
      title: 'Trạng thái', 
      key: 'status',
      render: (_: any, r: any) => {
        const status = r.status || r.Status || '';
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="m-0 text-gray-800 tracking-tight">Thống kê & Tổng quan</Title>
        <div className="flex gap-4">
            <DatePicker.RangePicker 
              value={dateRange} 
              onChange={(dates) => { if (dates) setDateRange(dates as [any, any]); }} 
              format="DD/MM/YYYY"
              allowClear={false}
              className="h-10 rounded-lg shadow-sm"
            />
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportToExcel} className="h-10 px-6 font-medium shadow-md hover:shadow-lg transition-all rounded-lg">
              Xuất báo cáo
            </Button>
        </div>
      </div>
      
      {/* STAT CARDS */}
      <Row gutter={[24, 24]} className='mb-8'>
        {/* Row 1 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Tổng tiền đã nhận</span>} value={summary.totalRevenue || summary.TotalRevenue || 0} suffix="₫" valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><DollarOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #a855f7, #c026d3)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Số người dùng (User)</span>} value={summary.totalUsers || summary.TotalUsers || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><UserOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #34d399, #14b8a6)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Số lượt bán</span>} value={summary.totalOrders || summary.TotalOrders || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><ShoppingCartOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #fb923c, #f59e0b)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Số sản phẩm đã bán</span>} value={summary.totalProductsSold || summary.TotalProductsSold || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><AppstoreOutlined /></div>
          </Card>
        </Col>
        
        {/* Row 2 */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #ef4444, #e11d48)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Số SP thất lạc</span>} value={summary.totalProductsLost || summary.TotalProductsLost || 0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><CloseCircleOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #ec4899, #f43f5e)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Loại SP bán nhiều nhất</span>} value={summary.topSellingCategory || summary.TopSellingCategory || 'Trống'} valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><FireOutlined /></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-md rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(to bottom right, #facc15, #f59e0b)' }}>
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>SP mua nhiều nhất</span>} value={summary.topSellingProduct || summary.TopSellingProduct || 'Trống'} valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '45px' }} />
            {(summary.topSellingProductImageUrl || summary.TopSellingProductImageUrl) ? (
                <img src={getImageUrl(summary.topSellingProductImageUrl || summary.TopSellingProductImageUrl)} className="absolute top-4 right-4 w-11 h-11 rounded-full object-cover border-2 border-white/50 shadow-sm" alt="Top Selling" />
            ) : (
                <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><StarOutlined /></div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            className="shadow-md rounded-2xl overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity" 
            style={{ background: 'linear-gradient(to bottom right, #64748b, #4b5563)' }}
            onClick={() => navigate('/admin/order', { state: { activeTab: 'Disputed' } })}
          >
            <Statistic title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500 }}>Danh sách đơn hàng đã khiếu nại</span>} value={disputedOrdersCount} valueStyle={{ color: '#fff', fontWeight: 'bold' }} />
            <div className="absolute top-4 right-4 text-4xl" style={{ color: 'rgba(255, 255, 255, 0.2)' }}><ExclamationCircleOutlined /></div>
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
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} lg={16}>
          <Card title={<span className="font-bold text-gray-700">Đơn hàng mới nhất</span>} bordered={false} className="shadow-sm rounded-2xl h-full">
            <Table 
              dataSource={recentOrders} 
              columns={orderColumns} 
              rowKey={(r: any) => r.id || r.Id} 
              pagination={false}
              size="middle"
              className="mt-4"
              expandable={{
                expandedRowRender: (record: any) => (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-inner text-sm m-2">
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={8}>
                        <div className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">📦 Thông tin giao hàng</div>
                        <div className="space-y-1">
                          <div><span className="text-gray-500 w-24 inline-block">Người nhận:</span> <span className="font-medium">{record.recipientName || record.RecipientName}</span></div>
                          <div><span className="text-gray-500 w-24 inline-block">Điện thoại:</span> <span className="font-medium">{record.phoneNumber || record.PhoneNumber}</span></div>
                          <div><span className="text-gray-500 w-24 inline-block flex-shrink-0">Địa chỉ:</span> <span className="font-medium break-words">{record.shippingAddress || record.ShippingAddress}</span></div>
                          <div><span className="text-gray-500 w-24 inline-block">Phí ship:</span> <span className="font-medium">{formatCurrency(record.shippingFee || record.ShippingFee || 0)}</span></div>
                        </div>
                      </Col>
                      <Col xs={24} md={16}>
                        <div className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">🛍️ Sản phẩm đã đặt</div>
                        <Table
                          dataSource={record.orderItems || record.OrderItems || []}
                          pagination={false}
                          size="small"
                          rowKey={(item: any) => item.productId || item.ProductId || Math.random()}
                          columns={[
                            {
                              title: 'Sản phẩm',
                              key: 'product',
                              render: (_: any, item: any) => (
                                <div className="flex items-center gap-3">
                                  <img src={getImageUrl(item.imageUrl || item.ImageUrl)} alt="product" className="w-10 h-10 object-cover rounded shadow-sm border border-gray-200 bg-white" />
                                  <div>
                                    <div className="font-medium text-gray-800">{item.productName || item.ProductName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{item.color || item.Color} / {item.size || item.Size}</div>
                                  </div>
                                </div>
                              )
                            },
                            {
                              title: 'SL',
                              key: 'qty',
                              width: 60,
                              align: 'center',
                              render: (_: any, item: any) => <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">x{item.quantity || item.Quantity}</span>
                            },
                            {
                              title: 'Đơn giá',
                              key: 'price',
                              align: 'right',
                              render: (_: any, item: any) => <span className="text-gray-600 font-medium">{formatCurrency(item.unitPrice || item.UnitPrice || 0)}</span>
                            }
                          ]}
                        />
                      </Col>
                    </Row>
                  </div>
                ),
                rowExpandable: (record: any) => !!(record.orderItems || record.OrderItems)?.length,
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span className="font-bold text-gray-700">Thống kê theo trạng thái</span>} bordered={false} className="shadow-sm rounded-2xl h-full">
            <Table
              dataSource={orderStatusLabels.map((label, i) => ({ status: label, count: orderStatusData[i] }))}
              rowKey="status"
              pagination={false}
              size="middle"
              columns={[
                { 
                  title: 'Trạng thái', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (status: string) => {
                    let color = 'default';
                    if (status.includes('hoàn thành') || status.includes('Đã bán') || status.includes('giao')) color = 'success';
                    else if (status.includes('hủy') || status.includes('thất lạc')) color = 'error';
                    else if (status.includes('chưa thanh toán')) color = 'warning';
                    else if (status.includes('chờ') || status.includes('đang')) color = 'processing';
                    return <Tag color={color}>{status}</Tag>;
                  }
                },
                { title: 'Số lượng', dataIndex: 'count', key: 'count', render: (val: number) => <span className="font-bold">{val} đơn</span> }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* TOP SELLING PRODUCTS LIST */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24}>
          <Card title={<span className="font-bold text-blue-600"><FireOutlined className="mr-2" />Danh sách 10 Sản phẩm bán chạy nhất</span>} bordered={false} className="shadow-sm rounded-2xl border-l-4 border-l-blue-500">
            <Table 
              dataSource={topProducts} 
              rowKey={(r) => r.id || r.productId || Math.random()} 
              pagination={false}
              size="middle"
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', render: (text: string, record: any) => <span className="font-medium text-gray-800">{text || record.ProductName}</span> },
                { title: 'Đã bán', key: 'soldQuantity', render: (_: any, record: any) => <Tag color="blue" className="font-bold">{record.soldQuantity || record.SoldQuantity || 0} lượt</Tag> },
                { title: 'Tồn kho', key: 'stockQuantity', render: (_: any, record: any) => <span>{record.stockQuantity || record.StockQuantity || 0}</span> },
                { title: 'Giá gốc', dataIndex: 'originalPrice', key: 'originalPrice', render: (val: number) => formatCurrency(val || 0) }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* LOW STOCK ALERT */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title={<span className="font-bold text-red-600"><ExclamationCircleOutlined className="mr-2" />Sản phẩm sắp hết hàng (Cần nhập thêm)</span>} bordered={false} className="shadow-sm rounded-2xl border-l-4 border-l-red-500">
            <Table 
              dataSource={lowStockProducts} 
              rowKey={(r) => r.id || r.productId || Math.random()} 
              pagination={false}
              size="small"
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', render: (text: string, record: any) => <span className="font-medium">{text || record.ProductName}</span> },
                { title: 'Tồn kho', key: 'stockQuantity', render: (_: any, record: any) => <Tag color="error" className="font-bold">{record.stockQuantity || record.StockQuantity || 0} cái</Tag> },
                { title: 'Đã bán', key: 'soldQuantity', render: (_: any, record: any) => <span>{record.soldQuantity || record.SoldQuantity || 0}</span> },
                { title: 'Giá', dataIndex: 'originalPrice', key: 'originalPrice', render: (val: number) => formatCurrency(val) }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
