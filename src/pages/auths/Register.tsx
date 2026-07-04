import { Button, Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/api/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();

      if (response.ok) {
        alert('Registration successful!');
        navigate('/login');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className='w-full'>
      <div className='mb-3 text-center'>
        <h2 className='font-bold text-2xl text-gray-800 mb-1'>Register</h2>
        <p className='text-gray-500 text-sm'>Create a new account to experience shopping</p>
      </div>

      <Form
        name='basic'
        layout='vertical'
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete='off'
        size='large'
        className='w-full'
      >
        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Username</span>}
          name='userName'
          hasFeedback
          rules={[{ required: true, type: 'string', message: 'Please enter your username!' }]}
          className='mb-4'
        >
          <Input placeholder='Your username' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Email</span>}
          name='email'
          hasFeedback
          rules={[
            { required: true, message: 'Please enter your email!' },
            {
              type: 'email',
              message: 'Invalid email format (e.g. abc@gmail.com)'
            }
          ]}
          className='mb-4'
        >
          <Input placeholder='Your email' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Phone Number</span>}
          name='phoneNumber'
          hasFeedback
          rules={[
            { required: true, message: 'Please enter your phone number!' },
            {
              pattern: /^(84|0[3|5|7|8|9])+([0-9]{8})\b$/,
              message: 'Invalid phone number (e.g. 0912345678)'
            }
          ]}
          className='mb-4'
        >
          <Input placeholder='Your phone number' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Password</span>}
          name='password'
          hasFeedback
          rules={[
            { required: true, message: 'Please enter your password!' },
            {
              pattern: /^(?=.*[A-Z]).+$/,
              message: 'Password must contain at least 1 uppercase letter'
            },
            {
              pattern: /^(?=.*[a-z]).+$/,
              message: 'Password must contain at least 1 lowercase letter'
            },
            {
              pattern: /^(?=.*\d).+$/,
              message: 'Password must contain at least 1 number'
            }
          ]}
          className='mb-4'
        >
          <Input.Password placeholder='Enter your password' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          name='confirm_password'
          label={<span className='font-medium text-gray-700 text-sm'>Confirm Password</span>}
          hasFeedback
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: 'Please confirm your password!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              }
            })
          ]}
          className='mb-4'
        >
          <Input.Password placeholder='Confirm your password' className='rounded-md text-sm' />
        </Form.Item>

        <div className='flex justify-center mb-6 text-sm'>
          <span className='text-gray-500 mr-1'>Already have an account?</span>
          <Link to='/login' className='text-[#ee4d2d] hover:text-[#d73f22] font-medium'>Login now</Link>
        </div>

        <Form.Item className='mb-0'>
          <Button 
            block 
            type='primary' 
            htmlType='submit' 
            loading={isLoading}
            className='bg-[#ee4d2d] hover:!bg-[#d73f22] border-none h-11 text-sm font-medium rounded-md shadow-md shadow-orange-500/20'
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default Register;
