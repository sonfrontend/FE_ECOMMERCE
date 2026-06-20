import React, { useEffect, useState } from 'react';
import { Table, Typography, message, Tag, Button, Space, Image, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/utils/imageUrl';

const { Title } = Typography;

export default function AdminDisputeManage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    try {
      const res = await http.get('/api/Dispute/admin/complaints');
      setComplaints(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khiếu nại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'orange';
      case 'Resolved': return 'green';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Mã Khiếu Nại',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <b>#{id}</b>
    },
    {
      title: 'Mã Đơn',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (id: number) => <span className="text-blue-500 font-bold">#{id}</span>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Lý do khiếu nại',
      dataIndex: 'reason',
      key: 'reason',
      width: 250
    },
    {
      title: 'Bằng chứng',
      dataIndex: 'evidenceUrl',
      key: 'evidenceUrl',
      render: (url: string) => url ? <Image src={getImageUrl(url, 'complants') ??""} width={50} height={50} className="object-cover rounded-md" /> : 'Không có'
    },

    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status === 'Processing' ? 'Đang chờ xử lý' : 'Đã giải quyết'}
        </Tag>
      )
    },

    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => record.status === 'Resolved' ? null : (
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => {
              message.info('Vui lòng tìm mã đơn #' + record.orderId + ' bên trang Đơn hàng để xử lý chi tiết');
              navigate('/admin/orders');
            }}
          >
            Giải quyết
          </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} className='mb-6'>Quản lý Khiếu nại & Đổi trả</Title>
      <Table 
        columns={columns} 
        dataSource={complaints} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-md m-2">
              <Descriptions column={2} size="small" bordered className="bg-white">
                <Descriptions.Item label="Ngày tạo">
                  {moment(record.createdAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Cách giải quyết">
                  <div className="font-semibold text-blue-600 mb-1">
                    {record.status === 'Resolved' ? (record.handlingMethodName || (record.handlingMethodId ? `Mẫu số ${record.handlingMethodId}` : 'Thỏa thuận khác')) : <span className="text-gray-400">-</span>}
                  </div>
                  {record.status === 'Resolved' && record.handlingMethodDescription && (
                    <div className="text-gray-600 mt-1 italic">{record.handlingMethodDescription}</div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền hoàn">
                  {record.status === 'Resolved' && record.refundAmount > 0 
                    ? <span className="text-red-500 font-bold">{record.refundAmount.toLocaleString()} đ</span> 
                    : <span className="text-gray-400">-</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú Admin">
                  {record.status === 'Resolved' ? (record.adminNote || 'Không') : <span className="text-gray-400">-</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức thanh toán">
                  {record.paymentMethod || <span className="text-gray-400">-</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Yêu cầu hoàn tiền">
                  {record.requiresRefund ? <span className="text-green-600 font-semibold">Có</span> : <span className="text-gray-400">Không</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Hoàn lại tồn kho">
                  {record.restoresInventory ? <span className="text-green-600 font-semibold">Có</span> : <span className="text-gray-400">Không</span>}
                </Descriptions.Item>
                <Descriptions.Item label="Ảnh Admin" span={2}>
                  {record.status === 'Resolved' && record.adminEvidenceUrl 
                    ? <Image src={record.adminEvidenceUrl} width={80} height={80} className="object-cover rounded-md shadow-sm" /> 
                    : <span className="text-gray-400">-</span>}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ),
        }}
      />

      <Modal
        title={`Chi tiết giải quyết khiếu nại #${selectedDispute?.id}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedDispute && (
          <Descriptions bordered column={1} size="small" labelStyle={{ width: '200px', fontWeight: 'bold' }}>
            <Descriptions.Item label="Mã Đơn">#{selectedDispute.orderId}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{selectedDispute.userName}</Descriptions.Item>
            <Descriptions.Item label="Lý do khiếu nại">{selectedDispute.reason}</Descriptions.Item>
            <Descriptions.Item label="Ngày khiếu nại">
              {moment(selectedDispute.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color="green">Đã giải quyết</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày giải quyết">
              {selectedDispute.resolvedAt ? moment(selectedDispute.resolvedAt).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Cách giải quyết">
              <span className="font-semibold text-blue-600">
                {selectedDispute.handlingMethodName || (selectedDispute.handlingMethodId ? `Mẫu số ${selectedDispute.handlingMethodId}` : 'Thỏa thuận khác')}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền hoàn lại">
              {selectedDispute.refundAmount > 0 
                ? <span className="text-red-500 font-bold">{selectedDispute.refundAmount.toLocaleString()} đ</span> 
                : 'Không hoàn tiền'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú của Admin">
              {selectedDispute.adminNote || 'Không có ghi chú'}
            </Descriptions.Item>
            {selectedDispute.adminEvidenceUrl && (
              <Descriptions.Item label="Bằng chứng từ Admin">
                <Image src={selectedDispute.adminEvidenceUrl} width={100} height={100} className="object-cover rounded-md" />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
