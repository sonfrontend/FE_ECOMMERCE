import { Button, Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const onFinish = async (values) => {
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
        alert('Đăng ký thành công!');
        navigate('/login');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className='w-full'>
      <div className='mb-3 text-center'>
        <h2 className='font-bold text-2xl text-gray-800 mb-1'>Đăng Ký</h2>
        <p className='text-gray-500 text-sm'>Tạo tài khoản mới để trải nghiệm mua sắm</p>
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
          label={<span className='font-medium text-gray-700 text-sm'>Tên đăng nhập</span>}
          name='userName'
          hasFeedback
          rules={[{ required: true, type: 'string', message: 'Vui lòng nhập tên đăng nhập!' }]}
          className='mb-4'
        >
          <Input placeholder='Tên đăng nhập của bạn' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Email</span>}
          name='email'
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            {
              type: 'email',
              message: 'Email không đúng định dạng (VD: abc@gmail.com)'
            }
          ]}
          className='mb-4'
        >
          <Input placeholder='Email của bạn' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Số điện thoại</span>}
          name='phoneNumber'
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng nhập số điện thoại!' },
            {
              pattern: /^(84|0[3|5|7|8|9])+([0-9]{8})\b$/,
              message: 'Số điện thoại không hợp lệ (VD: 0912345678)'
            }
          ]}
          className='mb-4'
        >
          <Input placeholder='Số điện thoại của bạn' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          label={<span className='font-medium text-gray-700 text-sm'>Mật khẩu</span>}
          name='password'
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
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
          className='mb-4'
        >
          <Input.Password placeholder='Nhập mật khẩu' className='rounded-md text-sm' />
        </Form.Item>

        <Form.Item
          name='confirm_password'
          label={<span className='font-medium text-gray-700 text-sm'>Nhập lại mật khẩu</span>}
          hasFeedback
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập lại mật khẩu!'
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
              }
            })
          ]}
          className='mb-4'
        >
          <Input.Password placeholder='Xác nhận mật khẩu' className='rounded-md text-sm' />
        </Form.Item>

        <div className='flex justify-center mb-6 text-sm'>
          <span className='text-gray-500 mr-1'>Đã có tài khoản?</span>
          <Link to='/login' className='text-[#ee4d2d] hover:text-[#d73f22] font-medium'>Đăng nhập ngay</Link>
        </div>

        <Form.Item className='mb-0'>
          <Button 
            block 
            type='primary' 
            htmlType='submit' 
            className='bg-[#ee4d2d] hover:!bg-[#d73f22] border-none h-11 text-sm font-medium rounded-md shadow-md shadow-orange-500/20'
          >
            Tạo tài khoản
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default Register;
