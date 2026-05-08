import { Button, Flex, Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import http from '@/apis/http';
import { toast } from 'react-toastify';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await http.post('/api/Auth/login', values);
      const data = response.data;
      if (response.status === 200) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
        window.location.href = '/';
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Lấy câu "Tên đăng nhập hoặc mật khẩu không đúng!"
        const messageFromBackend = error.response.data.message;
        toast.error(messageFromBackend);
      } else {
        toast.error('Đã có lỗi xảy ra. Vui lòng thử lại!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // const onFinishFailed = (errorInfo) => {
  //   console.log('Failed:', errorInfo);
  // };

  const handleGoogleSuccess = async (credentialResponse) => {
    // 1. Rút cái ID Token từ Google trả về
    const googleIdToken = credentialResponse.credential;
    console.log(googleIdToken);

    try {
      // 2. Ném thẳng Token này xuống API C# của bạn
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/Auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken: googleIdToken })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
        window.location.href = '/';
      } else {
        alert('Lỗi từ C#: ' + data.message);
      }
    } catch (error) {
      console.log('Lỗi gọi API:', error);
    }
  };

  return (
    <Form
      name='basic'
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      // onFinishFailed={onFinishFailed}
      autoComplete='off'
      layout='vertical'
      variant='underlined'
    >
      <div className='flex justify-center p-2 gap-2 items-center'>
        <h2 className='font-bold text-2xl'>Trello</h2>
      </div>
      <Form.Item label='Tên đăng nhập' name='userName' className='mb-2!'>
        <Input className='w-full' style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label='Mật khẩu' name='password' className='mb-2!'>
        <Input.Password className='w-full' style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item className='mb-2!'>
        <Flex justify='space-between' align='center'>
          <a href=''>Quên mật khẩu</a>
          <Link to='/register'>Chưa có tài khoản</Link>
        </Flex>
      </Form.Item>

      <Form.Item className='mb-2!'>
        <Button block type='primary' htmlType='submit' className='border border-gray-100 py-2 px-4' loading={isLoading}>
          Đăng nhập
        </Button>
      </Form.Item>
      <Form.Item className='mb-2!'>
        <Flex justify='center' align='center'>
          <span>or</span>
        </Flex>
      </Form.Item>
      <Form.Item className='mb-2!'>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            console.log('Đăng nhập Google thất bại');
          }}
        />
      </Form.Item>
    </Form>
  );
};
export default Login;
