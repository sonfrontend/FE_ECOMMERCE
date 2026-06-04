import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AppHeader from '../components/Header/Header';
import Footer from './components/Footer';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Jost', sans-serif !important;
        }
        
        /* Minimalist scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1; 
        }
        ::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}</style>
      <Layout className='min-h-screen bg-white font-sans'>
        {/* Top Navbar */}
        <AppHeader />

        {/* Main Content */}
        <Content className='flex flex-col min-h-0 bg-white'>
          <Outlet />
        </Content>

        {/* Advanced Footer */}
              <Footer />

      </Layout>
    </>
  );
};

export default MainLayout;
