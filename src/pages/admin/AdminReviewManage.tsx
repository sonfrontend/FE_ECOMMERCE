import React, { useEffect, useState } from 'react';
import { Table, Typography, message, Rate, Button, Popconfirm, Space, Avatar } from 'antd';
import { DeleteOutlined, UserOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import moment from 'moment';

const { Title } = Typography;

export default function AdminReviewManage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await http.get('/api/Review/admin');
      setReviews(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id: number) => {
    try {
      await http.delete(`/api/Review/admin/${id}`);
      message.success('Đã xóa đánh giá thành công');
      fetchReviews();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa đánh giá');
    }
  };

  const columns = [
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.avatarUrl} icon={<UserOutlined />} />
          <b>{record.userName}</b>
        </Space>
      )
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 250
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      render: (_: any, record: any) => (
        <Rate disabled defaultValue={record.rating} className='text-sm' />
      )
    },
    {
      title: 'Nội dung bình luận',
      dataIndex: 'comment',
      key: 'comment',
      width: 350
    },
    {
      title: 'Ngày Đánh giá',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => moment(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đánh giá này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteReview(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small">Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} className='mb-6'>Quản lý Đánh giá & Bình luận</Title>
      <Table 
        columns={columns} 
        dataSource={reviews} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
