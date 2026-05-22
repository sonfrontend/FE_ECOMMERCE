import React, { useState } from 'react';
import { message, Spin } from 'antd';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import http from '@/apis/http'; // Import file axios của bạn vào

interface Props {
  orderId: string;   // Internal Order ID (Mã đơn C#)
  amount: number;    // Số tiền
}

const PayPalPaymentButton: React.FC<Props> = ({ orderId, amount }) => {
  const [{ isPending }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  // Đổi VNĐ sang USD (Do PayPal không hỗ trợ VNĐ)
  const usdAmount = (amount / 25000).toFixed(2); 

  if (isPending) return <div className="text-gray-500">Đang tải cổng thanh toán...</div>;

  return (

    <div className="w-full relative">

 {/* LỚP PHỦ LOADING: Chỉ hiện lên khi isProcessing là true */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-md">
          <Spin size="large" tip="Đang xác nhận với hệ thống..." />
        </div>
      )}


    <PayPalButtons
      style={{ layout: "vertical" }}
 createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE", // Khai báo rõ mục đích là thanh toán ngay
            purchase_units: [
              {
                description: `Thanh toan don hang #${orderId}`,
                amount: {
                  currency_code: "USD",
                  value: usdAmount,
                },
              },
            ],
          } as any); // <-- THÊM "as any" Ở ĐÂY ĐỂ VƯỢT QUA LỖI BẮT BẺ CỦA TYPESCRIPT
        }}

      // HÀM NÀY CHẠY KHI KHÁCH ĐIỀN XONG MẬT KHẨU VÀ BẤM TRẢ TIỀN TRÊN PAYPAL
      onApprove={async (data, actions) => {
          try {
            setIsProcessing(true); 
            
            // ================================================================
            // BƯỚC BẢO MẬT MỚI: HỎI LẠI C# TRƯỚC KHI RÚT TIỀN KHÁCH HÀNG
            // ================================================================
            const checkRes = await http.get(`/api/Order/${orderId}/status`);
            
            if (checkRes.data.status !== 'PendingPayment') {
               // Đơn đã quá 2 phút (bị hủy) hoặc đã thanh toán trước đó
               message.error("Đơn hàng này đã hết hạn hoặc đã được thanh toán trước đó!");
               setIsProcessing(false);
               // Ngừng code ngay lập tức, KHÔNG CHẠY lệnh rút tiền bên dưới
               return; 
            }

            // ================================================================
            // CHỈ KHI C# XÁC NHẬN ĐƠN CÒN HỢP LỆ MỚI CHÍNH THỨC RÚT TIỀN
            // ================================================================
            const details = await actions.order?.capture();
            
            if (!details || details.status !== 'COMPLETED') {
              message.error("Giao dịch chưa hoàn tất trên hệ thống PayPal.");
              setIsProcessing(false);
              return;
            }

            // Gửi API về Backend C# để cập nhật trạng thái đơn hàng sang Đã Thanh Toán
            await http.post('/api/Payment/paypal-confirm', {
              internalOrderId: parseInt(orderId),
              paypalOrderId: details.id 
            });

            message.success(`Thanh toán thành công! Mã GD: ${details.id}`);
            window.location.href = '/history'; 

          } catch (error) {
            console.error("Lỗi xác nhận thanh toán:", error);
            message.error("Có lỗi xảy ra trong quá trình xử lý giao dịch!");
          } finally {
            setIsProcessing(false);
          }
        }}
      onError={(err) => {
        message.error("Thanh toán bị hủy hoặc có lỗi xảy ra.");
      }}
    />
    </div>
   
  );
};

export default PayPalPaymentButton;