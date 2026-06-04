import React, { useEffect, useState } from 'react';
import { Table, Typography, message, Tag, Button, Popconfirm, Space } from 'antd';
import { DeleteOutlined, UserOutlined } from '@ant-design/icons';
import http from '@/apis/http';

const { Title } = Typography;

export default function AdminUserManage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await http.get('/api/User');
      setUsers(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    try {
      await http.delete(`/api/User/${userId}`);
      message.success('Đã xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa người dùng');
    }
  };

  const columns = [
    {
      title: 'Tên Đăng Nhập',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string) => <b>{text}</b>
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: () => <Tag color="blue" icon={<UserOutlined />}>Người dùng</Tag> // Giao diện demo, vì API chưa trả role chi tiết
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tài khoản này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDeleteUser(record.userId)}
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
      <Title level={3} className='mb-6'>Quản lý tất cả người dùng</Title>
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="userId" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
