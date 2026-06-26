import React, { useEffect, useState } from 'react';
import { Table, Typography, message, Button, Popconfirm, Space, Modal, Form, Input, DatePicker, Switch, Image, InputNumber, Upload } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import moment from 'moment';
import dayjs from 'dayjs';
import { getImageUrl } from '@/utils/imageUrl';
import SafeImage from '@/components/SafeImage';

const { Title } = Typography;

const CustomImageUpload = ({ value, onChange }: { value?: string | File, onChange?: (val: string | File) => void }) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!value) {
      setPreviewUrl('');
      return;
    }
    if (typeof value === 'string') {
      setPreviewUrl(getImageUrl(value) ?? '');
    } else if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [value]);

  const beforeUpload = (file: File) => {
    if (onChange) {
      onChange(file);
    }
    return false; // Ngăn không cho Upload tự động gửi request
  };

  return (
    <div className="flex flex-col gap-4">
      {value ? (
        <div className="w-full h-48 border rounded-lg overflow-hidden relative group bg-gray-100 flex items-center justify-center">
          <img src={previewUrl} alt="preview" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-full h-48 border-2 border-dashed rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
          Chưa có ảnh banner
        </div>
      )}
      
      <Upload
        beforeUpload={beforeUpload}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />} type="dashed" className="w-full">
          Chọn ảnh mới
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
      const res = await http.get(`/api/Promotion?t=${new Date().getTime()}`);
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
      await fetchPromotions();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa');
    }
  };

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        ...record,
        dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
        isDiscount: record.discountPercentage > 0 || dayjs(record.endDate).year() < 2099
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ isActived: true, isDiscount: false });
    }
    setIsModalVisible(true);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      let finalImageUrl = values.imageUrl;

      // Nếu ảnh mới được chọn (dạng File), ta upload trước khi lưu form
      if (values.imageUrl instanceof File) {
        const formData = new FormData();
        formData.append('file', values.imageUrl);
        // DO NOT append oldImageUrl to prevent Cloudinary from deleting the old banner before DB is saved
        const res = await http.post('/api/Chat/upload-banner-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = res.data.url || res.data.imageUrl;
        form.setFieldsValue({ imageUrl: finalImageUrl }); // Cập nhật lại form để không upload 2 lần
      }

      const payload = {
        title: values.title,
        description: values.description || '',
        imageUrl: finalImageUrl,
        link: values.link || '',
        discountPercentage: values.isDiscount ? (values.discountPercentage || 0) : 0,
        startDate: values.isDiscount ? values.dateRange[0].toISOString() : new Date().toISOString(),
        endDate: values.isDiscount ? values.dateRange[1].toISOString() : new Date(2099, 11, 31).toISOString(),
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
      await fetchPromotions();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.response?.data?.title || error.message;
      message.error('Lỗi khi lưu dữ liệu: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Banner',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) =>  <SafeImage
          src={getImageUrl(url) ?? ''} 
          fallbackSrc={getImageUrl(url) ?? ''}
          alt="icon" 
          className="w-10 h-10 object-cover rounded border" 
        />
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
      render: (_: any, record: any) => {
        if (moment(record.endDate).year() >= 2099) {
          return <span className="text-sm text-gray-600">Vô thời hạn</span>;
        }
        return (
          <span className="text-sm text-gray-600">
            {moment(record.startDate).format('DD/MM/YYYY')} - {moment(record.endDate).format('DD/MM/YYYY')}
          </span>
        );
      }
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        if (!record.isActived) return <span className="text-gray-400 font-medium">Đã tắt</span>;
        
        if (moment(record.endDate).year() >= 2099) {
          return <span className="text-green-500 font-bold">Đang hiển thị</span>;
        }

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
          
          <Form.Item name="imageUrl" label="Ảnh Banner" rules={[{ required: true, message: 'Vui lòng tải lên ảnh banner' }]}>
            <CustomImageUpload />
          </Form.Item>

          <Form.Item name="isDiscount" label="Là chương trình Khuyến mãi" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.isDiscount !== currentValues.isDiscount}
          >
            {({ getFieldValue }) =>
              getFieldValue('isDiscount') ? (
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item name="dateRange" label="Thời gian áp dụng" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
                    <DatePicker.RangePicker className="w-full" showTime format="DD/MM/YYYY HH:mm" />
                  </Form.Item>
                  
                  <Form.Item name="discountPercentage" label="% Giảm giá (hiển thị)">
                    <InputNumber min={0} max={100} className="w-full" placeholder="Ví dụ: 50" />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

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
            <Button type="primary" htmlType="submit" loading={saving}>Lưu lại</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
