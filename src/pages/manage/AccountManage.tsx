import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Divider, Tag, Avatar, Row, Col } from 'antd';
import { UserOutlined, GoogleOutlined, SafetyCertificateOutlined, EditOutlined } from '@ant-design/icons';
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
        if (userInfo.googleId) return 'Google';
      } catch {}
    }
    return 'System';
  });

  const [form] = Form.useForm();
  const [userInfoState, setUserInfoState] = useState<any>({});

  useEffect(() => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        setUserInfoState(userInfo);
        form.setFieldsValue({
          userName: userInfo.userName || '',
          email: userInfo.email || '',
          fullName: userInfo.fullName || '',
          phoneNumber: userInfo.phoneNumber || ''
        });
      } catch (e) {}
    }
  }, [form]);

  const handleUpdateAccount = async (values: any) => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const res = await http.put('/api/User/update-profile', values);
      if (res.status === HttpStatusCode.Ok) {
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        setUserInfoState(res.data);
        toast.success('Cập nhật thông tin tài khoản thành công!');
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error: any) {
      const errorMsg = typeof error.response?.data === 'string' ? error.response.data : error.response?.data?.message;
      toast.error(errorMsg || error.message || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-8 h-full bg-white'>
      <div className='mb-8 border-b border-gray-100 pb-4'>
        <h2 className='text-2xl font-bold text-gray-800 mb-1'>Hồ sơ của tôi</h2>
        <p className='text-gray-500'>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      <div className='flex flex-row gap-12'>
        <div className='flex-1'>
          <Form layout='vertical' form={form} onFinish={handleUpdateAccount} className='max-w-2xl'>
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item label={<span className='text-gray-600 font-medium'>Phương thức đăng nhập</span>} className='mb-6'>
                  {loginProvider === 'Google' ? (
                    <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg w-max'>
                      <GoogleOutlined className='text-red-500 text-xl' />
                      <span className='font-medium text-red-700'>Tài khoản Google</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg w-max'>
                      <SafetyCertificateOutlined className='text-blue-500 text-xl' />
                      <span className='font-medium text-blue-700'>Tài khoản Hệ thống</span>
                    </div>
                  )}
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className='text-gray-600 font-medium'>Tên đăng nhập</span>}
                  name='userName'
                  rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                >
                  <Input size='large' className='rounded-lg hover:border-blue-400 focus:border-blue-500' disabled={loginProvider === 'Google'} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item 
                  label={<span className='text-gray-600 font-medium'>Họ và tên</span>} 
                  name='fullName'
                >
                  <Input size='large' className='rounded-lg hover:border-blue-400 focus:border-blue-500' placeholder='Nhập họ và tên' />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<span className='text-gray-600 font-medium'>Email</span>}
                  name='email'
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không đúng định dạng' }
                  ]}
                >
                  <Input size='large' className='rounded-lg hover:border-blue-400 focus:border-blue-500' disabled={loginProvider === 'Google'} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item 
                  label={<span className='text-gray-600 font-medium'>Số điện thoại</span>} 
                  name='phoneNumber'
                >
                  <Input size='large' className='rounded-lg hover:border-blue-400 focus:border-blue-500' placeholder='0123456789' />
                </Form.Item>
              </Col>
            </Row>

            {loginProvider === 'System' && (
              <>
                <div className='my-6 border-t border-gray-100'></div>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>Đổi mật khẩu <span className="text-sm font-normal text-gray-400">(Tuỳ chọn)</span></h3>
                <Form.Item
                  label={<span className='text-gray-600 font-medium'>Mật khẩu cũ</span>}
                  name='oldPassword'
                >
                  <Input.Password size='large' className='rounded-lg max-w-md hover:border-blue-400 focus:border-blue-500' placeholder='Nhập mật khẩu cũ nếu muốn đổi mật khẩu mới' />
                </Form.Item>
                <Form.Item
                  label={<span className='text-gray-600 font-medium'>Mật khẩu mới</span>}
                  name='password'
                  rules={[
                    { pattern: /^(?=.*[A-Z]).+$/, message: 'Mật khẩu phải có ít nhất 1 chữ hoa' },
                    { pattern: /^(?=.*[a-z]).+$/, message: 'Mật khẩu phải có ít nhất 1 chữ thường' },
                    { pattern: /^(?=.*\d).+$/, message: 'Mật khẩu phải có ít nhất 1 số' }
                  ]}
                >
                  <Input.Password size='large' className='rounded-lg max-w-md hover:border-blue-400 focus:border-blue-500' placeholder='Bỏ trống nếu không muốn đổi' />
                </Form.Item>
              </>
            )}

            <Form.Item className='mt-8'>
              <Button 
                type='primary' 
                htmlType='submit' 
                size='large'
                loading={isLoading} 
                className='px-8 rounded-lg bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all h-12 text-base font-medium'
              >
                Lưu Thay Đổi
              </Button>
            </Form.Item>
          </Form>
      </div>
      </div>
    </div>
  );
}
