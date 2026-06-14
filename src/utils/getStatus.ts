import { OrderStatus } from "@/contants/OrderStatus.enum";

export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
      case OrderStatus.PendingPayment?.toLowerCase():
      case OrderStatus.Pending?.toLowerCase():
        return 'orange';
      case OrderStatus.Delivered?.toLowerCase():
        return 'green';
      case OrderStatus.Cancelled?.toLowerCase():
        return 'red';
      case OrderStatus.Disputed?.toLowerCase():
        return 'volcano';
      case OrderStatus.Refunded?.toLowerCase():
        return 'magenta';
      default:
        return 'default';
    }}


 export const getStatusText = (status: string, paymentMethod: string) => {
    switch (status?.toLowerCase()) {
      case OrderStatus.PendingPayment?.toLowerCase():
        return 'Đã đặt mà chưa thanh toán';
      case OrderStatus.Pending?.toLowerCase():
        return paymentMethod === 'COD' ? 'Đã đặt' : 'Đã đặt và thanh toán rồi';
      case OrderStatus.Processing?.toLowerCase():
        return 'Nhận đơn và chuẩn bị đồ để giao';
      case OrderStatus.Shipped?.toLowerCase():
        return 'Đang giao';
      case OrderStatus.Delivered?.toLowerCase():
        return 'Đã giao đến nơi (Chờ xác nhận)';
      case OrderStatus.Completed?.toLowerCase():
        return paymentMethod === 'COD' ? 'Đã nhận và thanh toán - hoàn thành' : 'Đã nhận - hoàn thành';
      case OrderStatus.Cancelled?.toLowerCase():
        return 'Đã hủy';
      case OrderStatus.Disputed?.toLowerCase():
        return 'Đang khiếu nại';
      case OrderStatus.Refunded?.toLowerCase():
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };