import React, { useEffect, useState } from 'react';
import { Modal, Button, Typography } from 'antd';
import { GiftOutlined, CopyOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import http from '@/apis/http';

const { Title, Text } = Typography;

const PromoPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await http.get('/api/Voucher');
      if (res.data && res.data.length > 0) {
        setVouchers(res.data);
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Không thể tải danh sách voucher", error);
    }
  };

  const handleSave = async (id: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.info('Vui lòng đăng nhập để lưu mã giảm giá!');
      setIsVisible(false);
      navigate('/login');
      return;
    }

    try {
      await http.post(`/api/Voucher/save/${id}`);
      toast.success('Đã lưu mã giảm giá vào ví!');
      
      // Có thể lọc bỏ mã vừa lưu khỏi danh sách (tùy chọn)
      setVouchers(prev => prev.filter(v => v.id !== id));
      if (vouchers.length === 1) setIsVisible(false);
    } catch (error: any) {
      toast.error(error.response?.data || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (vouchers.length === 0) return null;

  return (
    <Modal
      open={isVisible}
      onCancel={handleClose}
      footer={null}
      centered
      closable={true}
      width={450}
      styles={{
        body: { padding: 0 }
      }}
    >
      <div className="bg-gradient-to-b from-[#ee4d2d] to-[#ff7337] p-6 rounded-lg text-center text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-white opacity-10 rounded-full"></div>
        <div className="absolute bottom-[-30px] right-[-30px] w-32 h-32 bg-white opacity-10 rounded-full"></div>

        <GiftOutlined className="text-5xl mb-4" />
        <Title level={3} className="text-white! mb-2">Quà Tặng Bạn Mới!</Title>
        <Text className="text-white/90 block mb-6">
          Nhanh tay thu thập các mã giảm giá siêu hot dưới đây!
        </Text>

        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {vouchers.map((voucher) => (
            <div key={voucher.id} className="bg-white text-gray-800 rounded-lg p-3 relative shadow-md flex items-center justify-between">
              <div className="text-left flex-1 border-r border-dashed border-gray-300 pr-3">
                <div className="text-xl font-bold text-[#ee4d2d]">
                  Giảm {new Intl.NumberFormat('vi-VN').format(voucher.discountValue)}đ
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Đơn tối thiểu {new Intl.NumberFormat('vi-VN').format(voucher.minOrderValue)}đ
                </div>
              </div>
              
              <div className="pl-3 flex flex-col items-center justify-center min-w-[90px]">
                <div className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 mb-2">
                  {voucher.code}
                </div>
                <Button 
                  type="primary" 
                  size="small" 
                  className="bg-[#ee4d2d] border-none text-xs"
                  onClick={() => handleSave(voucher.id)}
                >
                  Lưu
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default PromoPopup;
