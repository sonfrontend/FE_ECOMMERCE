import { OrderStatus } from "@/contants/OrderStatus.enum";

export const getStatusColor = (status: string): string => {
  // Chuyển status về chữ thường 1 lần để code gọn và tối ưu hiệu năng
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case OrderStatus.PendingPayment.toLowerCase():
      return 'gold'; // Màu vàng kim: Nhắc nhở nạp tiền/thanh toán
    case OrderStatus.Pending.toLowerCase():
      return 'orange'; // Màu cam: Chờ shop xác nhận
    case OrderStatus.Processing.toLowerCase():
      return 'cyan'; // Màu xanh lơ: Shop đang thao tác đóng gói
    case OrderStatus.Shipped.toLowerCase():
      return 'blue'; // Màu xanh dương: Đang trên đường đi
    case OrderStatus.Delivered.toLowerCase():
      return 'lime'; // Màu xanh nõn chuối: Đã đến nơi, chờ khách check
    case OrderStatus.Completed.toLowerCase():
      return 'green'; // Màu xanh lá đậm: Hoàn thành mỹ mãn
    case OrderStatus.Cancelled.toLowerCase():
      return 'red'; // Màu đỏ: Đơn thất bại/bị hủy
    case OrderStatus.Disputed.toLowerCase():
      return 'volcano'; // Màu đỏ cam (núi lửa): Báo động có tranh chấp
    case OrderStatus.Refunded.toLowerCase():
      return 'magenta'; // Màu hồng tím: Đã hoàn tiền
    case OrderStatus.Lost.toLowerCase():
      return 'gray'; // Màu xám: Hàng biến mất/thất lạc
    case OrderStatus.PendingResolution.toLowerCase():
      return 'purple'; // Màu tím: Chờ khách hàng ra quyết định
    case OrderStatus.Resolved.toLowerCase():
      return 'green'; 
    default:
      return 'default';
  }
};

export const getStatusText = (status: string, paymentMethod?: string): string => {
  const normalizedStatus = status?.toLowerCase();

  switch (normalizedStatus) {
    case OrderStatus.PendingPayment.toLowerCase():
      return 'Chờ thanh toán';
    
    case OrderStatus.Pending.toLowerCase():
      // Tinh chỉnh text ngắn gọn, chuyên nghiệp hơn
      return paymentMethod === 'COD' 
        ? 'Chờ xác nhận' 
        : 'Đã thanh toán (Chờ xác nhận)';
    
    case OrderStatus.Processing.toLowerCase():
      return 'Đang chuẩn bị hàng';
    
    case OrderStatus.Shipped.toLowerCase():
      return 'Đang giao hàng';
    
    case OrderStatus.Delivered.toLowerCase():
      return 'Đã giao đến nơi (Chờ xác nhận)';
    
    case OrderStatus.Completed.toLowerCase():
      return 'Hoàn thành';
    
    case OrderStatus.Cancelled.toLowerCase():
      return 'Đã hủy';
    
    case OrderStatus.Disputed.toLowerCase():
      return 'Đang khiếu nại';
    
    case OrderStatus.Refunded.toLowerCase():
      return 'Đã hoàn tiền';

    case OrderStatus.Lost.toLowerCase():
      return 'Thất lạc do vận chuyển';

    case OrderStatus.PendingResolution.toLowerCase():
      return 'Chờ xác nhận giải quyết';

    case OrderStatus.Resolved.toLowerCase():
      return 'Đã giải quyết khiếu nại';

    default:
      return status || 'Không xác định';
  }
};