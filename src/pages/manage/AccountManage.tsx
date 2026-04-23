import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Divider, Tag } from 'antd';
import { UserOutlined, GoogleOutlined } from '@ant-design/icons';
import http from '@/apis/http';
import { HttpStatusCode } from '@/contants/httpStatusCode.enum';
import { toast } from 'react-toastify';

export default function AccountManage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginProvider] = useState(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo.googleId) {
          return 'Google';
        }
      } catch {
        /* empty */
      }
    }
    return 'System';
  });

  const [form] = Form.useForm();

  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        form.setFieldsValue({
          userName: userInfo.userName || '',
          email: userInfo.email || '',
          fullName: userInfo.fullName || '',
          phoneNumber: userInfo.phoneNumber || ''
        });
      } catch (e) {
        console.error('Failed to parse userInfo', e);
      }
    }
  }, [form]);

  /* ------------------- HANDLERS ------------------- */

  const handleUpdateAccount = async (values) => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const res = await http.put('/api/User/update-profile', values);
      if (res.status === HttpStatusCode.Ok) {
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        toast.success('Cập nhật thông tin tài khoản thành công!');
      }
    } catch (error) {
      toast.error('Lỗi: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------- RENDER ------------------- */
  return (
    <Card title='Quản lý tài khoản của bạn' className='w-full shadow-sm rounded-lg'>
      <Form layout='vertical' form={form} onFinish={handleUpdateAccount}>
        {/* Phương thức đăng nhập */}
        <Form.Item label={<span>Phương thức đăng nhập</span>} className='mb-4!'>
          {loginProvider === 'Google' ? (
            <Tag color='error' icon={<GoogleOutlined />} className='px-3 py-1 text-sm'>
              Tài khoản Google
            </Tag>
          ) : (
            <Tag color='blue' icon={<UserOutlined />} className='px-3 py-1 text-sm'>
              Tài khoản Hệ thống
            </Tag>
          )}
        </Form.Item>

        <Form.Item
          label={<span>Tên đăng nhập</span>}
          name='userName'
          hasFeedback
          rules={[{ required: true, type: 'string', message: 'Vui lòng nhập tên đăng nhập' }]}
          className='mb-2!'
        >
          <Input className='w-full' style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label='Họ và tên' name='fullName' className='mb-2!'>
          <Input placeholder='Nhập họ và tên' />
        </Form.Item>
        <Form.Item
          label={<span>Email</span>}
          name='email'
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng nhập email' },
            {
              type: 'email',
              message: 'Email không đúng định dạng Vd:abc@gmail.com'
            }
          ]}
          className='mb-2!'
        >
          <Input className='w-full' style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label='Số điện thoại' name='phoneNumber'>
          <Input placeholder='0123456789' />
        </Form.Item>
        {loginProvider === 'System' && (
          <>
            <Divider>Đổi mật khẩu</Divider>
            <Form.Item
              label={<span>Mật khẩu</span>}
              name='password'
              hasFeedback
              rules={[
                {
                  pattern: /^(?=.*[A-Z]).+$/,
                  message: 'Mật khẩu phải có ít nhất 1 chữ hoa'
                },
                {
                  pattern: /^(?=.*[a-z]).+$/,
                  message: 'Mật khẩu phải có ít nhất 1 chữ thường'
                },
                {
                  pattern: /^(?=.*\d).+$/,
                  message: 'Mật khẩu phải có ít nhất 1 số'
                }
              ]}
              className='mb-4!'
            >
              <Input.Password className='w-full' style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
        <Button type='primary' htmlType='submit' loading={isLoading} disabled={isLoading}>
          Lưu cập nhật
        </Button>
      </Form>
    </Card>
  );
}
