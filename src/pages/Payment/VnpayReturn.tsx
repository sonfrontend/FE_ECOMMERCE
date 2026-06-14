import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Result, Button, Spin, Typography, message } from 'antd';
import http from '@/apis/http';

const { Title, Text } = Typography;

const VnpayReturn: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await http.get(`/api/Payment/vnpay-return${location.search}`);
        if (response.data.success) {
          message.success("Thanh toán đơn hàng bằng VNPay thành công!");
          navigate('/history');
        } else {
          setSuccess(false);
          setStatusMessage(response.data.message);
          setLoading(false);
        }
      } catch (error: any) {
        setSuccess(false);
        setStatusMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực thanh toán VNPay');
        setLoading(false);
      }
    };

    if (location.search) {
      verifyPayment();
    } else {
      setLoading(false);
      setSuccess(false);
      setStatusMessage('Không tìm thấy thông tin giao dịch');
    }
  }, [location.search, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spin size="large" />
        <Title level={4} className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán VNPay...</Title>
        <Text className="text-gray-400">Vui lòng không đóng trình duyệt</Text>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rounded-lg shadow-sm">
      <Result
        status={success ? "success" : "error"}
        title={success ? "Thanh Toán Thành Công!" : "Thanh Toán Thất Bại"}
        subTitle={statusMessage}
        extra={[
          <Button type="primary" key="history" onClick={() => navigate('/history')} className="bg-[#ee4d2d]">
            Xem Đơn Hàng
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>
            Về Trang Chủ
          </Button>,
        ]}
      />
    </div>
  );
};

export default VnpayReturn;
