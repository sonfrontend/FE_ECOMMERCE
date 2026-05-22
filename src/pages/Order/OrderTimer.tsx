import React, { useState, useEffect, useRef } from 'react';
import { Statistic, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface OrderTimerProps {
  startTime: string;   
  onExpire: () => void; 
}

const OrderTimer: React.FC<OrderTimerProps> = ({ startTime, onExpire }) => {
  const [deadline, setDeadline] = useState<number>(0);
  const hasTriggeredExpire = useRef<boolean>(false);
  
  // Dùng ref để lưu trữ mốc thời gian hết hạn cố định, phục vụ cho logic ngầm
  const expireTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!startTime) return;

    const startMs = new Date(startTime).getTime();
    const expireMs = startMs + 2 * 60 * 1000;
    
    expireTimeRef.current = expireMs;

    // Hàm kiểm tra thời gian thực tế độc lập với giao diện
    const checkExpiration = () => {
      if (hasTriggeredExpire.current) return;
      
      // So sánh thời gian hiện tại với mốc hết hạn
      if (Date.now() >= expireTimeRef.current) {
        setDeadline(0);
        hasTriggeredExpire.current = true;
        onExpire(); // Bắn event ngay lập tức
      }
    };

    // Chạy kiểm tra ngay lần render đầu tiên
    checkExpiration();
    if (!hasTriggeredExpire.current) {
      setDeadline(expireMs);
    }

    // --- BẮT ĐẦU XỬ LÝ LỖI CHUYỂN TAB ---

    // 1. Page Visibility API: Bắt sự kiện ngay khi user click quay lại tab này
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkExpiration(); 
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkExpiration); // Backup thêm cho an toàn

    // 2. Chạy ngầm một setInterval tự động check mỗi giây
    // Dù bị trình duyệt làm chậm khi ẩn tab, nhưng ngay khi trình duyệt cho chạy lại 1 nhịp,
    // nó sẽ dùng Date.now() để kiểm tra nên không bao giờ bị sai lệch kết quả.
    const intervalId = setInterval(() => {
      checkExpiration();
      if (hasTriggeredExpire.current) {
        clearInterval(intervalId); // Nếu hết hạn rồi thì dọn dẹp interval luôn
      }
    }, 1000);

      console.log({
  startTimeTuBackend: startTime,
  startMs: new Date(startMs).toLocaleString(),
  bayGioLa: new Date().toLocaleString(),
  chenhLech: (Date.now() - startMs) / 1000 + " giây"
});

    // Cleanup function khi component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkExpiration);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]);

  if (deadline === 0) {
    return <Tag color="error">Đơn hàng đã hết hạn thanh toán</Tag>;
  }



  return (
    <div className="flex items-center gap-2 bg-[#fff4f4] text-[#ee4d2d] px-4 py-2 rounded-full font-medium">
      <ClockCircleOutlined />
      <span>Thời gian thanh toán còn lại:</span>
      <Statistic.Countdown
        value={deadline}
        onFinish={() => {
          // Antd Countdown tự chạy xong thì cũng gọi check (Backup lần 3)
          if (!hasTriggeredExpire.current) {
            hasTriggeredExpire.current = true;
            onExpire();
          }
        }}
        format="mm:ss"
        valueStyle={{
          fontSize: '18px',
          color: '#ee4d2d',
          fontWeight: 'bold',
          lineHeight: '1'
        }}
      />
    </div>
  );
};

export default OrderTimer;