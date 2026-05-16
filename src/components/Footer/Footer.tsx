import React from 'react';
import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

const Footer: React.FC = () => {
  return (
    <AntFooter className='bg-white font-sans'>
      <div className='max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-semibold text-gray-500 uppercase tracking-widest'>
        <div className='hover:text-black transition-colors cursor-pointer'>© {new Date().getFullYear()} E-COMMERCE</div>
      </div>
    </AntFooter>
  );
};

export default Footer;
