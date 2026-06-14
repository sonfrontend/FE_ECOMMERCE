import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Popconfirm, message, Modal, Form, Input, InputNumber, PaginationProps, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { getImageUrl } from '@/utils/imageUrl';

const { Title } = Typography;

export default function ProductManage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts(currentPage, pageSize);
    fetchCategories();
  }, [currentPage, pageSize]);

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

  const fetchProducts = async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await http.get(`/api/AdminProduct?page=${page}&pageSize=${size}`);
      const { data, totalItems } = res.data;
      
      const flatProducts = data.map((item: any) => ({
        articleId: item.articleId,
        productCode: item.productCode,
        productName: item.productName,
        price: item.price,
        stockQuantity: item.stockQuantity,
        imageUrl: item.imageUrl,
        color: item.color || item.Color,
        size: item.size || item.Size,
        categoryId: item.categoryId || item.CategoryId,
        categoryName: item.categories?.name || item.categories?.Name || item.categories?.categoryName || item.categoryId || item.CategoryId,
        description: item.description || item.Description,
        origin: item.origin || item.Origin,
        fabricType: item.fabricType || item.FabricType
      }));
      setProducts(flatProducts);
      setTotalItems(totalItems);
    } catch (error) {
      // Mock data nếu API lỗi
      setProducts([
        { articleId: 'A001', productCode: 'P01', productName: 'Áo thun nam', price: 200000, stockQuantity: 50 },
        { articleId: 'A002', productCode: 'P02', productName: 'Quần Jeans', price: 500000, stockQuantity: 30 },
      ]);
      setTotalItems(2);
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
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await http.put(`/api/AdminProduct/${editingId}`, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await http.post('/api/AdminProduct', values);
        message.success('Thêm sản phẩm thành công');
      }
      setIsModalVisible(false);
      fetchProducts(currentPage, pageSize);
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (url: string) => url ? <img src={getImageUrl('/images/' + url)} alt="product" className="w-12 h-12 object-cover rounded" /> : 'N/A'
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price?.toLocaleString() || 0} VNĐ`
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
    },
    {
      title: 'Màu sắc',
      dataIndex: 'color',
      key: 'color',
    },
    {
      title: 'Kích cỡ',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string, record: any) => text || record.categoryId
    },
    {
      title: 'Xuất xứ',
      dataIndex: 'origin',
      key: 'origin',
    },
    {
      title: 'Loại vải',
      dataIndex: 'fabricType',
      key: 'fabricType',
    },
    {
      title: 'Hành động',
      key: 'action',
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm sản phẩm mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={products} 
        rowKey="articleId" 
        loading={loading}
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
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="articleId" label="Article ID" rules={[{ required: !editingId, message: 'Vui lòng nhập ID' }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="productCode" label="Mã Sản Phẩm" rules={[{ required: true, message: 'Vui lòng nhập mã SP' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="productName" label="Tên Sản Phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên SP' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="stockQuantity" label="Tồn kho" rules={[{ required: true, message: 'Vui lòng nhập tồn kho' }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          
          <div className="flex gap-4">
            <Form.Item name="color" label="Màu sắc" className="flex-1">
              <Input />
            </Form.Item>
            <Form.Item name="size" label="Kích cỡ" className="flex-1">
              <Input />
            </Form.Item>
            <Form.Item name="categoryId" label="Danh mục" className="flex-1" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
              <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
                {categories.map(cat => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.isParent ? <b>{cat.name}</b> : `  --- ${cat.name}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="flex gap-4">
            <Form.Item name="origin" label="Xuất xứ" className="flex-1">
              <Input />
            </Form.Item>
            <Form.Item name="fabricType" label="Loại vải" className="flex-1">
              <Input />
            </Form.Item>
          </div>

          <Form.Item name="imageUrl" label="URL Hình ảnh">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả sản phẩm">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
