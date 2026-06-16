export enum OrderStatus {
    Pending = 'Pending',
    PendingPayment = 'PendingPayment', // Thêm trạng thái mới cho đơn hàng đang chờ thanh toán
    Processing = 'Processing',
    Shipped = 'Shipped',
    Delivered = 'Delivered',
    Completed = 'Completed',
    Cancelled = 'Cancelled',
    Refunded = 'Refunded',
    Disputed = 'Disputed',
    PendingResolution = 'PendingResolution',
    Resolved = 'Resolved',
    Lost = 'Lost'
}

export const getOrderStatusList = (): string[] => {
  return Object.values(OrderStatus);
};