import buyImg from '@/assets/images/buy.png';
import { Typography } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4'>
      <div className='flex flex-row w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden'>
        
        {/* Left Side - Image */}
        <div className='w-1/2 flex bg-white items-center justify-center p-8'>
          <img 
            src={buyImg} 
            alt='Shopping Illustration' 
            className='w-full max-w-[350px] h-auto object-contain' 
          />
        </div>

        {/* Right Side - Form */}
        <div className='w-1/2 flex items-center justify-center p-8 lg:p-12'>
          <div className='w-full max-w-sm'>
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthLayout;
