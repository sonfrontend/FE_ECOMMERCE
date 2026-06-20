import React, { useEffect, useState } from 'react';
import { Table, Typography, message, Button, Popconfirm, Space, Modal, Form, Input, DatePicker, Switch, Image, InputNumber, Upload } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import moment from 'moment';
import dayjs from 'dayjs';
import { getImageUrl } from '@/utils/imageUrl';

const { Title } = Typography;

const CustomImageUpload = ({ value, onChange, placeholder = "Nhập URL hoặc tải ảnh lên" }: { value?: string, onChange?: (val: string) => void, placeholder?: string }) => {
  const [uploading, setUploading] = useState(false);

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const res = await http.post('/api/Chat/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onChange) {
        onChange(res.data.url);
      }
      onSuccess("ok");
    } catch (err: any) {
      console.error(err);
      onError(err);
      message.error("Tải ảnh thất bại!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {value && (
        <div className="w-12 h-12 flex-shrink-0 border rounded overflow-hidden relative group">
          <img src={getImageUrl(value) ?? ''} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}
      <Input
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Upload
        customRequest={customRequest}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}>
          {uploading ? 'Đang tải...' : 'Tải lên'}
        </Button>
      </Upload>
    </div>
  );
};

export default function AdminPromotionManage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const fetchPromotions = async () => {
    try {
      const res = await http.get('/api/Promotion');
      setPromotions(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await http.delete(`/api/Promotion/${id}`);
      message.success('Đã xóa khuyến mãi/banner thành công');
      fetchPromotions();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
    }
  };

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        ...record,
        dateRange: [dayjs(record.startDate), dayjs(record.endDate)]
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ isActived: true });
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        description: values.description || '',
        imageUrl: values.imageUrl,
        link: values.link || '',
        discountPercentage: values.discountPercentage || 0,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        isActived: values.isActived
      };

      if (editingId) {
        await http.put(`/api/Promotion/${editingId}`, payload);
        message.success('Cập nhật thành công');
      } else {
        await http.post('/api/Promotion', payload);
        message.success('Thêm mới thành công');
      }
      setIsModalVisible(false);
      fetchPromotions();
    } catch (error) {
      message.error('Lỗi khi lưu dữ liệu');
    }
  };

  const columns = [
    {
      title: 'Banner',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => <Image src={getImageUrl(url) ?? ''} width={80} height={40} className="object-cover rounded-md" />
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <b className="text-blue-600">{text}</b>
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (val: number) => val > 0 ? <span className="text-red-500 font-bold">{val}%</span> : '-'
    },
    {
      title: 'Hiệu lực',
      key: 'date',
      render: (_: any, record: any) => (
        <span className="text-sm text-gray-600">
          {moment(record.startDate).format('DD/MM/YYYY')} - {moment(record.endDate).format('DD/MM/YYYY')}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        if (!record.isActived) return <span className="text-gray-400 font-medium">Đã tắt</span>;
        
        const now = moment();
        const start = moment(record.startDate);
        const end = moment(record.endDate);

        if (now.isBefore(start)) {
          return <span className="text-orange-500 font-bold">Sắp diễn ra</span>;
        } else if (now.isAfter(end)) {
          return <span className="text-red-500 font-bold">Đã kết thúc</span>;
        } else {
          return <span className="text-green-500 font-bold">Đang diễn ra</span>;
        }
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm
            title="Xóa banner này?"
            onConfirm={() => handleDelete(record.id)}
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
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className='mb-0'>Quản lý Banner & Khuyến mãi</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm Banner mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={promotions} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Cập nhật Banner' : 'Thêm Banner mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} className="mt-4">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
            <Input placeholder="Ví dụ: Siêu Sale Giáng Sinh" />
          </Form.Item>
          
          <Form.Item name="imageUrl" label="URL Ảnh Banner" rules={[{ required: true, message: 'Vui lòng nhập link ảnh' }]}>
            <CustomImageUpload />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="dateRange" label="Thời gian áp dụng" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
              <DatePicker.RangePicker className="w-full" showTime format="DD/MM/YYYY HH:mm" />
            </Form.Item>
            
            <Form.Item name="discountPercentage" label="% Giảm giá (hiển thị)">
              <InputNumber min={0} max={100} className="w-full" placeholder="Ví dụ: 50" />
            </Form.Item>
          </div>

          <Form.Item name="link" label="Link chuyển hướng khi click">
            <Input placeholder="/danh-muc/dien-thoai" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả phụ">
            <Input.TextArea rows={3} placeholder="Mô tả thêm..." />
          </Form.Item>

          <Form.Item name="isActived" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu lại</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
