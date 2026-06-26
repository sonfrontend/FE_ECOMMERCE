import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography, Popconfirm, TreeSelect, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { getImageUrl } from '@/utils/imageUrl';

const { Title } = Typography;

const CustomImageUpload = ({ value, onChange, placeholder = "Nhập URL hoặc tải ảnh lên" }: { value?: string | File, onChange?: (val: string | File) => void, placeholder?: string }) => {
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
    return false; // Prevent auto upload
  };

  return (
    <div className="flex items-center gap-2">
      {previewUrl && (
        <div className="w-12 h-12 flex-shrink-0 border rounded overflow-hidden relative group">
           <img 
          src={(previewUrl) ?? ''} 
          alt="icon" 
          className="w-full h-full object-cover"
        />
        </div>
      )}
      <Input
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
        readOnly={value instanceof File}
      />
      <Upload
        beforeUpload={beforeUpload}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />}>
          Tải lên
        </Button>
      </Upload>
    </div>
  );
};

const AdminCategoryManage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Category');
      // API trả về mảng cây danh mục, map field "subCategories" sang "children" cho Ant Table / TreeSelect
      const mapTreeData = (data: any[]): any[] => {
        return data.map(item => ({
          ...item,
          key: item.id,
          value: item.id,
          title: item.name,
          children: item.subCategories?.length > 0 ? mapTreeData(item.subCategories) : undefined
        }));
      };
      setCategories(mapTreeData(res.data));
    } catch (error) {
      message.error('Lỗi khi tải danh sách Danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({
        name: record.name,
        iconUrl: record.iconUrl,
        parentId: record.parentId,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      let finalIconUrl = values.iconUrl;

      // Upload if it's a new file
      if (values.iconUrl instanceof File) {
        const formData = new FormData();
        formData.append('file', values.iconUrl);
        formData.append('folder', 'images/categories'); // Save categories to images/categories folder
        // Do NOT send oldImageUrl here to prevent premature deletion

        const res = await http.post('/api/Chat/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalIconUrl = res.data.imageName;
        form.setFieldsValue({ iconUrl: finalIconUrl });
      }

      const payload = {
        ...values,
        iconUrl: finalIconUrl
      };

      if (editingId) {
        await http.put(`/api/Category/admin/${editingId}`, payload);
        message.success('Cập nhật danh mục thành công');
      } else {
        await http.post('/api/Category/admin', payload);
        message.success('Tạo danh mục mới thành công');
      }
      setIsModalVisible(false);
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await http.delete(`/api/Category/admin/${id}`);
      message.success('Xóa danh mục thành công');
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data || 'Không thể xóa danh mục này');
    }
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <span className={record.level === 0 ? "font-bold text-[#82b541]" : ""}>{text}</span>
      )
    },
    {
      title: 'Icon',
      dataIndex: 'iconUrl',
      key: 'iconUrl',
      render: (url: string) => url ? (
        <img src={getImageUrl(url) ?? ''} alt="icon" className="w-8 h-8 object-cover rounded border" />
      ) : '-'
    },{
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          <Popconfirm title="Bạn có chắc muốn xóa Danh mục này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm w-full h-full'>
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className='mb-0'>Quản lý Danh mục</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="bg-[#82b541] border-none">
          Thêm danh mục mới
        </Button>
      </div>

      <Table
        dataSource={categories}
        columns={columns}
        rowKey='id'
        loading={loading}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
      />

      <Modal
        title={editingId ? "Sửa Danh mục" : "Thêm Danh mục mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="Nhập tên danh mục..." />
          </Form.Item>

          <Form.Item name="parentId" label="Danh mục cha (Trống nếu là thư mục gốc)">
            <TreeSelect
              showSearch
              className="w-full"
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="Chọn danh mục cha"
              allowClear
              treeDefaultExpandAll
              treeData={categories}
              treeNodeFilterProp="title"
            />
          </Form.Item>

          <Form.Item name="iconUrl" label="Ảnh Icon">
            <CustomImageUpload />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={saving} className="bg-[#82b541] border-none">
              Lưu Danh mục
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCategoryManage;
