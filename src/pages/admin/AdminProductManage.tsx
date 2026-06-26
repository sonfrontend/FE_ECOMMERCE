import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Popconfirm, message, Modal, Form, Input, InputNumber, PaginationProps, Select, Card, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { getImageUrl } from '@/utils/imageUrl';
import SafeImage from '@/components/SafeImage';

const { Title } = Typography;

const CustomImageUpload = ({ value, onChange, placeholder = "Nhập URL hoặc tải ảnh lên" }: { value?: any, onChange?: (val: any) => void, placeholder?: string }) => {
  
  const beforeUpload = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    if (onChange) onChange({ file, previewUrl });
    return false; // Prevent auto upload
  };

  const displayUrl = typeof value === 'string' ? (value ?  getImageUrl(value) : '') : (value?.previewUrl || '');
  const inputValue = typeof value === 'string' ? value : '';

  return (
    <div className="flex items-center gap-2">
      {displayUrl && <img src={displayUrl} alt="preview" className="w-10 h-10 object-cover rounded border" />}
      <Input 
        value={inputValue} 
        onChange={e => onChange?.(e.target.value)} 
        placeholder={placeholder} 
        className="flex-1" 
        readOnly={typeof value === 'object'}
      />
      <Upload beforeUpload={beforeUpload} showUploadList={false}>
        <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
      </Upload>
    </div>
  );
};

export default function AdminProductManage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts(currentPage, pageSize, searchKeyword);
    fetchCategories();
  }, [currentPage, pageSize, searchKeyword]);

  const fetchCategories = async () => {
    try {
      const res = await http.get('/api/Category');
      const flatCats: any[] = [];
      res.data.forEach((parent: any) => {
        const pId = parent.id || parent.Id || parent.categoryId;
        const pName = parent.name || parent.Name || parent.categoryName || 'Unknown';
        flatCats.push({ id: pId, name: pName, isParent: true });
        
        const subs = parent.subCategories || parent.SubCategories;
        if (subs && subs.length > 0) {
          subs.forEach((sub: any) => {
            const sId = sub.id || sub.Id || sub.categoryId;
            const sName = sub.name || sub.Name || sub.categoryName || 'Unknown';
            flatCats.push({ id: sId, name: `${pName} - ${sName}`, isParent: false });
          });
        }
      });
      setCategories(flatCats);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục', error);
    }
  };

  const fetchProducts = async (page: number, size: number, search: string = '') => {
    setLoading(true);
    try {
      const res = await http.get(`/api/AdminProduct?page=${page}&pageSize=${size}&search=${encodeURIComponent(search)}`);
      const { data, totalItems } = res.data;
      setProducts(data || []);
      setTotalItems(totalItems || 0);
    } catch (error) {
      message.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange: PaginationProps['onChange'] = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/api/AdminProduct/${id}`);
      message.success('Xóa sản phẩm thành công');
      fetchProducts(currentPage, pageSize);
    } catch (error) {
      message.error('Lỗi khi xóa sản phẩm');
    }
  };

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.articleId);
      form.setFieldsValue({
        articleId: record.articleId,
        productName: record.productName,
        categoryId: record.categoryId,
        description: record.description,
        imageUrl: record.imageUrl,
        variants: record.variants || []
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ variants: [] });
    }
    setIsModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      
      const uploadImageIfNeeded = async (imgValue: any) => {
        if (imgValue && typeof imgValue === 'object' && imgValue.file) {
          const formData = new FormData();
          formData.append('file', imgValue.file);
          formData.append('folder', 'images'); // Save products to images folder
          const res = await http.post('/api/Chat/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return res.data.imageName;
        }
        return imgValue;
      };

      values.imageUrl = await uploadImageIfNeeded(values.imageUrl);
      
      if (values.variants) {
        for (let i = 0; i < values.variants.length; i++) {
          values.variants[i].imageUrl = await uploadImageIfNeeded(values.variants[i].imageUrl);
        }
      }

      const payload = {
        productId: values.articleId,
        productName: values.productName,
        categoryId: values.categoryId,
        description: values.description,
        imageUrl: values.imageUrl,
        variants: values.variants || []
      };

      if (editingId) {
        await http.put(`/api/AdminProduct/${editingId}`, payload);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await http.post('/api/AdminProduct', payload);
        message.success('Thêm sản phẩm thành công');
      }
      setIsModalVisible(false);
      fetchProducts(currentPage, pageSize);
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const expandedRowRender = (record: any) => {
    const variantColumns = [
      {
        title: 'Hình ảnh',
        dataIndex: 'imageUrl',
        key: 'imageUrl',
        render: (img: string) => img ? <img src={getImageUrl(img)} alt="variant" className="w-10 h-10 object-cover rounded border" /> : <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-400">Trống</div>
      },
      { title: 'SKU', dataIndex: 'sku', key: 'sku' },
      { title: 'Màu sắc', dataIndex: 'color', key: 'color' },
      { title: 'Kích cỡ', dataIndex: 'size', key: 'size' },
      { title: 'Tồn kho', dataIndex: 'stockQuantity', key: 'stockQuantity' },
      { title: 'Giá gốc', dataIndex: 'originalPrice', key: 'originalPrice', render: (val: number) => `${val?.toLocaleString() || 0} đ` },
      { title: 'Giá bán', dataIndex: 'currentPrice', key: 'currentPrice', render: (val: number) => <span className="text-red-500 font-semibold">{val?.toLocaleString() || 0} đ</span> },
    ];

    return (
      <div className="bg-gray-50 p-4 rounded border">
        <Typography.Text strong className="mb-2 block">Danh sách biến thể:</Typography.Text>
        <Table 
          columns={variantColumns} 
          dataSource={record.variants || []} 
          pagination={false} 
          rowKey="variantId" 
          size="small" 
        />
      </div>
    );
  };

  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'articleId',
      key: 'articleId',
      width: 100
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string) => url ?  <img   
          src={getImageUrl(url) ?? ''} 
          alt="icon" 
          className="w-12 h-12 object-cover rounded" 
        /> : 'N/A'
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string, record: any) => text || record.categoryId
    },
    {
      title: 'Số phân loại',
      key: 'variantsCount',
      render: (_: any, record: any) => `${record.variants?.length || 0} biến thể`
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} size="small" />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.articleId)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="!mb-0">Quản lý sản phẩm</Title>
        <div className="flex gap-4">
          <Input.Search 
            placeholder="Tìm kiếm mã hoặc tên sản phẩm..." 
            allowClear 
            onSearch={(value) => {
              setSearchKeyword(value);
              setCurrentPage(1);
            }} 
            style={{ width: 300 }} 
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Thêm sản phẩm mới
          </Button>
        </div>
      </div>

      <Table 
        columns={columns} 
        dataSource={products} 
        rowKey="articleId" 
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ 
          current: currentPage, 
          pageSize: pageSize, 
          total: totalItems,
          onChange: handleTableChange
        }}
      />

      <Modal
        title={editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText="Lưu lại"
        cancelText="Hủy"
        width={1000}
        confirmLoading={saving}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Card size="small" title="1. Thông tin chung (Sản phẩm cha)" className="mb-4">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="articleId" label="Mã Sản Phẩm (ID)" rules={[{ required: !editingId, message: 'Vui lòng nhập ID' }]}>
                <Input disabled={!!editingId} placeholder="VD: SP001" />
              </Form.Item>
              <Form.Item name="productName" label="Tên Sản Phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên SP' }]}>
                <Input placeholder="Tên sản phẩm..." />
              </Form.Item>
              <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
                  {categories.map(cat => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.isParent ? <b>{cat.name}</b> : `  --- ${cat.name}`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="imageUrl" label="URL Hình ảnh (Chính)">
                <CustomImageUpload placeholder="Đường dẫn ảnh đại diện sản phẩm" />
              </Form.Item>
            </div>
            <Form.Item name="description" label="Mô tả sản phẩm" className="mb-0">
              <Input.TextArea rows={3} placeholder="Mô tả chi tiết sản phẩm..." />
            </Form.Item>
          </Card>

          <Card size="small" title="2. Phân loại sản phẩm (Biến thể con)">
            <Form.List name="variants">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-2 px-2">
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-2">Màu sắc</div>
                    <div className="col-span-2">Kích cỡ</div>
                    <div className="col-span-2">Tồn kho</div>
                    <div className="col-span-2">Giá gốc</div>
                    <div className="col-span-1">Giá bán</div>
                    <div className="col-span-1 text-center">Xóa</div>
                  </div>
                  
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded-lg relative">
                      <Form.Item {...restField} name={[name, 'variantId']} hidden><Input /></Form.Item>
                      <Form.Item {...restField} name={[name, 'sku']} className="col-span-2 mb-0" rules={[{ required: true, message: 'Thiếu' }]}>
                        <Input placeholder="SKU" size="small" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'color']} className="col-span-2 mb-0" rules={[{ required: true, message: 'Thiếu' }]}>
                        <Input placeholder="Màu" size="small" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'size']} className="col-span-2 mb-0" rules={[{ required: true, message: 'Thiếu' }]}>
                        <Input placeholder="Size" size="small" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'stockQuantity']} className="col-span-2 mb-0">
                        <InputNumber min={0} placeholder="Tồn" size="small" className="w-full" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'originalPrice']} className="col-span-2 mb-0">
                        <InputNumber min={0} placeholder="Giá gốc" size="small" className="w-full" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'currentPrice']} className="col-span-1 mb-0">
                        <InputNumber min={0} placeholder="Giá bán" size="small" className="w-full" />
                      </Form.Item>
                      <div className="col-span-1 flex justify-center items-center h-6 mt-1">
                        <DeleteOutlined onClick={() => remove(name)} className="text-red-500 cursor-pointer text-base hover:scale-110 transition-transform" />
                      </div>
                      
                      {/* Có thể thêm Ảnh cho từng biến thể ở dưới nếu cần */}
                      <Form.Item {...restField} name={[name, 'imageUrl']} className="col-span-12 mb-0 mt-2">
                        <CustomImageUpload placeholder="URL hình ảnh (Tùy chọn cho phân loại này)" />
                      </Form.Item>
                    </div>
                  ))}
                  
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-2">
                    Thêm phân loại mới (Màu sắc / Kích cỡ)
                  </Button>
                </div>
              )}
            </Form.List>
          </Card>
        </Form>
      </Modal>
    </div>
  );
}
