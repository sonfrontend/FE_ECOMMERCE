import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, message, Skeleton } from 'antd';
import moment from 'moment';
import http from '@/apis/http';

const { Title } = Typography;

export default function UserVoucherManage({ setActiveTab }: { setActiveTab?: (key: string) => void }) {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Voucher/my-all-vouchers');
      setVouchers(res.data);
    } catch (error) {
      message.error('Không thể tải danh sách voucher.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const columns = [
    {
      title: 'Mã Voucher',
      dataIndex: ['voucher', 'code'],
      key: 'code',
      render: (text: string) => <Tag color="blue" className="text-base font-bold">{text}</Tag>
    },
    {
      title: 'Mức giảm giá',
      key: 'discountValue',
      render: (_: any, record: any) => (
        <span className="font-bold text-[#ee4d2d]">
          {new Intl.NumberFormat('vi-VN').format(record.voucher?.discountValue || 0)}đ
        </span>
      )
    },
    {
      title: 'Đơn tối thiểu',
      key: 'minOrderValue',
      render: (_: any, record: any) => (
        <span>{new Intl.NumberFormat('vi-VN').format(record.voucher?.minOrderValue || 0)}đ</span>
      )
    },
    {
      title: 'Ngày hết hạn',
      key: 'endDate',
      render: (_: any, record: any) => (
        <span>{moment(record.voucher?.endDate).format('DD/MM/YYYY HH:mm')}</span>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        if (record.isUsed) {
          return (
            <div>
              <Tag color="red">Đã sử dụng</Tag>
              {record.orderId && (
                <div className="mt-1 text-xs text-gray-500">
                  Đơn hàng: <a 
                    className="text-[#ee4d2d] hover:underline cursor-pointer"
                    onClick={() => {
                      if (setActiveTab) {
                        setActiveTab('2');
                        setTimeout(() => {
                          const el = document.getElementById(`order-${record.orderId}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }
                    }}
                  >
                    #{record.orderId}
                  </a>
                </div>
              )}
            </div>
          );
        }
        
        const isExpired = moment().isAfter(moment(record.voucher?.endDate));
        if (isExpired) {
          return <Tag color="orange">Đã hết hạn</Tag>;
        }

        return <Tag color="green">Chưa sử dụng</Tag>;
      }
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <div className="mb-6">
        <Title level={4} className='mb-0'>
          Quản lý Voucher của tôi
        </Title>
        <p className="text-gray-500 mt-1">Xem tất cả các mã giảm giá bạn đã lưu, bao gồm cả những mã đã sử dụng hoặc hết hạn.</p>
      </div>

      <Table
        dataSource={vouchers}
        columns={columns}
        rowKey='id'
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
