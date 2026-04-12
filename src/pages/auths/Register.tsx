import { Button, Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Login = () => {
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
    <Form
      name='basic'
      labelCol={{ span: 24 }}
      wrapperCol={{ span: 24 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete='off'
      layout='vertical'
      variant='underlined'
    >
      <div className='flex justify-center p-2 gap-2 items-center'>
        <h2 className='font-bold text-2xl'>Trello</h2>
      </div>
      <Form.Item
        label={<span>Tên đăng nhặp</span>}
        name='userName'
        hasFeedback
        rules={[{ required: true, type: 'string', message: 'Vui lòng nhập tên đăng nhập' }]}
        className='mb-2!'
      >
        <Input className='w-full' style={{ width: '100%' }} />
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

      <Form.Item
        label={<span>Mật khẩu</span>}
        name='password'
        hasFeedback
        rules={[
          { required: true, message: 'Vui lòng nhập mật khẩu' },
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

      <Form.Item
        name='confirm_password'
        label={<span>Nhập lại mật khẩu</span>}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Vui lòng nhập lại mật khẩu'
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject('Nhập khẩu không khớp');
            }
          })
        ]}
        className='mb-2!'
      >
        <Input.Password className='w-full' style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item className='mb-2! flex justify-center'>
        <Link to='/login'>Đã có tài khoản!</Link>
      </Form.Item>

      <Form.Item className='mb-2!'>
        <Button block type='primary' htmlType='submit' className='border border-gray-100 py-2 px-4'>
          Đăng ký
        </Button>
      </Form.Item>
    </Form>
  );
};
export default Login;
