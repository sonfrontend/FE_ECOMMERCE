import React, { useEffect, useState } from 'react';
import { Table, Typography, Card, Statistic, Tag, message, Tabs } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import AdminPaymentManage from './AdminPaymentManage';

const { Title } = Typography;

interface WalletData {
  balance: number;
  accountName: string;
}

interface TransactionData {
  id: number;
  orderId: number | null;
  amountChanged: number;
  newBalance: number;
  transactionType: string;
  transactionDate: string;
  description: string;
}

interface CodSummaryData {
  totalCodReceived: number;
  totalCodPending: number;
  totalManualRefunded: number;
}

const AdminWalletManage: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [codTransactions, setCodTransactions] = useState<TransactionData[]>([]);
  const [codSummary, setCodSummary] = useState<CodSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, transRes, codRes, codTransRes] = await Promise.all([
        http.get('/api/AdminWallet'),
        http.get('/api/AdminWallet/transactions'),
        http.get('/api/AdminWallet/cod-summary'),
        http.get('/api/AdminWallet/cod-transactions')
      ]);
      setWallet(walletRes.data);
      setTransactions(transRes.data);
      setCodSummary(codRes.data);
      setCodTransactions(codTransRes.data);
    } catch (error) {
      message.error('Lỗi khi tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const columns = [
    {
      title: 'Mã Đơn Hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (id: number | null) => id ? <b>#{id}</b> : <span className="text-gray-400">Không có</span>
    },
    {
      title: 'Thời gian',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (date: string) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: 'Biến động',
      dataIndex: 'amountChanged',
      key: 'amountChanged',
      render: (amount: number) => {
        const isPositive = amount > 0;
        return (
          <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}₫{new Intl.NumberFormat('vi-VN').format(amount)}
          </span>
        );
      }
    },
    {
      title: 'Loại Giao Dịch',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: string) => (
        <Tag color={type === 'PAYMENT' ? 'green' : 'red'}>
          {type === 'PAYMENT' ? 'Nhận thanh toán' : 'Hoàn tiền'}
        </Tag>
      )
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Tổng số tiền',
      dataIndex: 'newBalance',
      key: 'newBalance',
      render: (amount: number, record: any) => {
        if (record.id?.toString().startsWith('order_') || record.id?.toString().startsWith('refund_')) {
          return <span className="text-gray-400">-</span>; // COD transactions do not have a balance
        }
        return (
          <span className='text-[#ee4d2d] font-bold'>
            ₫{new Intl.NumberFormat('vi-VN').format(amount)}
          </span>
        );
      }
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full min-h-full'>
      <Title level={3} className='mb-6'>
        Quản lý Dòng tiền (VNPAY & Tiền mặt)
      </Title>

      <Tabs defaultActiveKey="1" items={[
        {
          key: '1',
          label: 'Duyệt thanh toán',
          children: <AdminPaymentManage />
        },
        {
          key: '2',
          label: 'Báo cáo Dòng tiền',
          children: (
            <div className="pt-4">
              <Title level={4} className='mb-4'>Dòng tiền Online (Mô phỏng VNPay)</Title>
              <Card className="mb-8 shadow-sm border-gray-200">
                <Statistic
                  title={
                    <span className="text-lg font-medium text-gray-600">
                      Số dư tài khoản: {wallet?.accountName}
                    </span>
                  }
                  value={wallet?.balance || 0}
                  precision={0}
                  valueStyle={{ color: '#ee4d2d', fontSize: '36px', fontWeight: 'bold' }}
                  prefix={<DollarOutlined />}
                  suffix="₫"
                />
              </Card>

              <Title level={4} className='mb-4'>Dòng tiền Tiền mặt (Thanh toán khi nhận hàng - COD)</Title>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="shadow-sm border-gray-200">
                  <Statistic
                    title={<span className="text-lg font-medium text-gray-600">Tiền COD đã thu (Đơn Hoàn thành)</span>}
                    value={codSummary?.totalCodReceived || 0}
                    precision={0}
                    valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                    prefix={<DollarOutlined />}
                    suffix="₫"
                  />
                </Card>
              </div>

              <Title level={4} className='mb-4 mt-8'>Lịch sử Giao dịch Online (Sao kê VNPay)</Title>
              <Table
                dataSource={transactions}
                columns={columns}
                rowKey='id'
                loading={loading}
                pagination={{ pageSize: 5 }}
              />

              <Title level={4} className='mb-4 mt-8'>Lịch sử Giao dịch Tiền mặt (Thực thu COD & Hoàn tiền thủ công)</Title>
              <Table
                dataSource={codTransactions}
                columns={columns}
                rowKey='id'
                loading={loading}
                pagination={{ pageSize: 5 }}
              />
            </div>
          )
        }
      ]} />
    </div>
  );
};

export default AdminWalletManage;
