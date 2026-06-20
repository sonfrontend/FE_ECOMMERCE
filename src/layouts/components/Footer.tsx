import React from 'react';
import { Typography, Row, Col } from 'antd';
import { FacebookOutlined, InstagramOutlined, TwitterOutlined, YoutubeOutlined } from '@ant-design/icons';
import fbIcon from '../../assets/icons/fb.svg';
import zlIcon from '../../assets/icons/zl.svg';

const { Title, Text, Link } = Typography;

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t-4 border-[#ee4d2d] mt-6 pt-6 px-12 md:px-20 text-gray-600 text-sm">
      <Row gutter={[32, 32]} className="mb-2">
        <Col xs={24} sm={12} md={6}>
          <Title level={5} className="!text-gray-800 uppercase !text-sm mb-4">CUSTOMER SERVICE</Title>
          <ul className="space-y-2">
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Help Center</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">How to Buy</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Payment</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Shipping</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Return & Refund</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Contact Us</Link></li>
          </ul>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Title level={5} className="!text-gray-800 uppercase !text-sm mb-4">ABOUT US</Title>
          <ul className="space-y-2">
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">About Store</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Store Policies</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Privacy Policy</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Authentic Guarantee</Link></li>
            <li><Link href="#" className="text-gray-500 hover:text-[#ee4d2d]">Media Contact</Link></li>
          </ul>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Title level={5} className="!text-gray-800 uppercase !text-sm mb-4">PAYMENT</Title>
          <div className="flex gap-2 flex-wrap mb-6">
            <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/d4bbea4570b93bfd5fc652ca82a262a8" alt="Visa" /></div>
            <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/a0a9062ebe19b45c1ae0506f16af5c16" alt="Mastercard" /></div>
            <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/38fd98e55806c3b2e4535c4e4a6c4c08" alt="JCB" /></div>
            <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/bc2a874caeee705449c164be385b796c" alt="COD" /></div>
          </div>
          
          <Title level={5} className="!text-gray-800 uppercase !text-sm mb-4">LOGISTICS</Title>
          <div className="flex gap-2 flex-wrap">
             <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/vn-50009109-159200e3e365de418aae52b840f24185" alt="SPX" /></div>
             <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/d10b0ec09f0322f9201a4f3daf378ed2" alt="GHN" /></div>
             <div className="bg-white shadow p-2 rounded w-14 h-8 flex items-center justify-center"><img src="https://down-vn.img.susercontent.com/file/59270fb2f3fbb7cbc92fca3877edde3f" alt="GHTK" /></div>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Title level={5} className="!text-gray-800 uppercase !text-sm mb-4">FOLLOW US</Title>
          <ul className="space-y-3">
            <li>
              <Link href="https://m.me/lqson2001" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#ee4d2d] flex items-center gap-2">
                <img src={fbIcon} alt="Facebook" className="w-5 h-5 rounded-full object-contain" /> Facebook
              </Link>
            </li>
            <li>
              <Link href="https://zalo.me/0345505829" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#ee4d2d] flex items-center gap-2">
                <img src={zlIcon} alt="Zalo" className="w-5 h-5 rounded-full object-contain" /> Zalo
              </Link>
            </li>
          </ul>
        </Col>
      </Row>
      {/* <div className="border-t border-gray-200 pt-3 mt-3 flex flex-col md:flex-row justify-between items-center text-xs">
        <Text className="text-gray-500 md:mb-0">© 2026 E-Commerce Store. All Rights Reserved.</Text>
        <div className="text-gray-500 flex gap-4">
           <span>Country & Region: Vietnam</span>
        </div>
      </div> */}
    </footer>
  );
};

export default Footer;
