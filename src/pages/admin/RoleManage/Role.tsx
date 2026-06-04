import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { IRole } from './types';
import http from '@/apis/http';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';

const { Title } = Typography;

export default function RoleTab() {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await http.get('/api/Role');
        if (res.status === 200) {
          const mappedRoles = res.data?.data?.map((item) => ({
            roleId: item.roleId,
            roleName: item.roleName
          }));

          setRoles(mappedRoles);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchRoles();
  }, []);

  const isEditing = (record: IRole) => record.roleId === editingKey;

  const handleEdit = (record: IRole) => {
    setAction('edit');
    form.setFieldsValue({ name: '', ...record });
    setEditingKey(record.roleId);
  };

  const handleCancel = (id: string) => {
    setEditingKey('');
    if (id.startsWith('temp_')) {
      setRoles(roles.filter((r) => r.roleId !== id));
    }
  };

  const handleSave = async (key: string) => {
    try {
      const row = await form.validateFields();

      const newData = [...roles];
      const index = newData.findIndex((item) => key === item.roleId);

      if (index > -1) {
        // 1. Chuẩn bị dữ liệu
        const item = newData[index];
        const payload = { ...item, ...row };

        // Quan trọng: Xóa ID tạm nếu là Thêm mới để C# tự sinh Guid chuẩn
        if (action === 'add' && key.startsWith('temp_')) {
          delete payload.roleId;
        }

        // 2. Khai báo biến res với kiểu any (hoặc kiểu AxiosResponse) để fix lỗi gạch chân
        let res;

        // 3. Rẽ nhánh gọi API tương ứng
        if (action === 'add') {
          res = await handleApiAdd(payload);
        } else if (action === 'edit') {
          res = await handleApiEdit(payload);
        }

        // 4. Xử lý kết quả chung
        if (res && res.status === 200) {
          const dataFromDB = {
            roleId: res.data.role.roleId,
            roleName: res.data.role.roleName
          };

          newData.splice(index, 1, dataFromDB);
          setRoles(newData);
          setEditingKey('');
        } else {
          console.error('Lỗi từ server:', res);
        }
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleDelete = async (role: IRole) => {
    try {
      const res = await handleApiDelete(role.roleId);
      if (res.status === 200) {
        toast.success(`${res.data.message}`);
        setRoles(roles.filter((item) => item.roleId !== role.roleId));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = () => {
    setAction('add');
    const newId = uuid();
    const newRecord: IRole = { roleId: newId, roleName: '' };
    if (!editingKey) {
      setRoles([newRecord, ...roles]);
      form.setFieldsValue({ name: '' });
      setEditingKey(newId);
    }
  };

  const handleApiAdd = async (role: IRole) => {
    setIsLoading(true);
    try {
      const res = await http.post('/api/Role', role);
      if (res.status === 200) {
        toast.success('Thêm role thành công');
        setIsLoading(false);
        return res;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.response?.data?.message || 'Thêm role thất bại');
    }
  };

  const handleApiDelete = async (roleId: string) => {
    setIsLoading(true);
    try {
      const res = await http.delete(`/api/Role/${roleId}`);
      if (res.status === 200) {
        setIsLoading(false);
        return res;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.response?.data?.message || 'Xóa role thất bại');
    }
  };

  const handleApiEdit = async (role: IRole) => {
    setIsLoading(true);
    try {
      const res = await http.put(`/api/Role/${role.roleId}`, role);
      if (res.status === 200) {
        setIsLoading(false);
        return res;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.response?.data?.message || 'Sửa role thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên Role',
      dataIndex: 'roleName',
      render: (text: string, record: IRole) =>
        isEditing(record) ? (
          <Form.Item
            name='roleName'
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Vui lòng nhập tên role!' }]}
          >
            <Input placeholder='Nhập tên...' />
          </Form.Item>
        ) : (
          <Tag color='geekblue' className='text-sm px-2 py-1'>
            {text}
          </Tag>
        )
    },
    {
      title: 'Hành động',
      dataIndex: 'handle',
      width: 150,
      align: 'center' as const,
      render: (_: unknown, record: IRole) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type='primary'
              size='small'
              onClick={() => handleSave(record.roleId)}
              icon={<SaveOutlined />}
              loading={isLoading}
            />
            <Button
              size='small'
              onClick={() => handleCancel(record.roleId)}
              icon={<CloseOutlined />}
              disabled={isLoading}
            />
          </Space>
        ) : (
          <Space>
            <Button
              type='text'
              onClick={() => handleEdit(record)}
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              disabled={editingKey !== ''}
            />
            <Popconfirm title='Bạn có chắc là muốn xóa role này?' onConfirm={() => handleDelete(record)}>
              <Button type='text' danger icon={<DeleteOutlined />} disabled={editingKey !== ''} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div className='animate-fade-in p-1'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <Title level={5} className='!mb-1'>
            Danh sách vai trò (Roles)
          </Title>
          <p className='text-gray-500 text-sm'>Quản lý các nhóm quyền cho người dùng</p>
        </div>
        <Button type='primary' onClick={handleAdd} icon={<PlusOutlined />} className='shadow-md'>
          Thêm Role mới
        </Button>
      </div>
      <Form form={form} component={false}>
        <Table
          bordered
          dataSource={roles}
          columns={columns}
          rowKey='id'
          pagination={{ pageSize: 5 }}
          className='shadow-sm rounded-lg overflow-hidden'
        />
      </Form>
    </div>
  );
}
