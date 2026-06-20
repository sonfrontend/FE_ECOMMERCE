import { Button, Flex, Form, Input, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import http from '@/apis/http';
import { toast } from 'react-toastify';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { GoogleOutlined } from '@ant-design/icons';

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
        
        if (data.userInfo?.roles?.includes('Admin')) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
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

  const handleGoogleLogin = async () => {
    try {
      // 1. Mở popup đăng nhập Google của Firebase
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Rút cái ID Token từ Firebase trả về
      const googleIdToken = await result.user.getIdToken();
      console.log(googleIdToken);

      // 3. Ném thẳng Token này xuống API C# của bạn
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
        
        if (data.userInfo?.roles?.includes('Admin')) {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        alert('Lỗi từ C#: ' + data.message);
      }
    } catch (error) {
      console.log('Lỗi đăng nhập Google Firebase:', error);
      toast.error('Đăng nhập Google thất bại');
    }
  };

  return (
    <div className='w-full'>
      <div className='mb-3 text-center'>
        <h2 className='font-bold text-2xl text-gray-800 mb-1'>Đăng Nhập</h2>
        <p className='text-gray-500 text-sm'>Vui lòng đăng nhập để tiếp tục mua sắm</p>
      </div>

      <Form
        name='basic'
        layout='vertical'
        initialValues={{ remember: true }}
        onFinish={onFinish}
        autoComplete='off'
        size='large'
        className='w-full'
      >
        <Form.Item 
          label={<span className='font-medium text-gray-700 text-sm'>Tên đăng nhập</span>} 
          name='userName' 
          rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          className='mb-4'
        >
          <Input placeholder='Nhập tên đăng nhập của bạn' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item 
          label={<span className='font-medium text-gray-700 text-sm'>Mật khẩu</span>} 
          name='password'
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          className='mb-4'
        >
          <Input.Password placeholder='Nhập mật khẩu' className='rounded-md text-sm' />
        </Form.Item>

        <Flex justify='space-between' align='center' className='mb-6 text-sm'>
          <a href='#' className='text-[#ee4d2d] hover:text-[#d73f22] font-medium'>Quên mật khẩu?</a>
          <Link to='/register' className='text-gray-500 hover:text-gray-800 font-medium'>Đăng ký tài khoản</Link>
        </Flex>

        <Form.Item className='mb-4'>
          <Button 
            block 
            type='primary' 
            htmlType='submit' 
            loading={isLoading}
            className='bg-[#ee4d2d] hover:!bg-[#d73f22] border-none h-11 text-sm font-medium rounded-md shadow-md shadow-orange-500/20'
          >
            Đăng nhập
          </Button>
        </Form.Item>

        <Divider plain className='text-gray-400 border-gray-200 text-xs my-3'>HOẶC</Divider>

        <Form.Item className='mb-0'>
          <Button 
            block 
            icon={<GoogleOutlined className="text-lg" />} 
            onClick={handleGoogleLogin}
            className="flex items-center justify-center font-medium h-11 text-sm text-gray-700 border-gray-300 hover:!border-gray-400 hover:!text-gray-800 rounded-md"
          >
            Tiếp tục với Google
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default Login;
