import { FloatButton } from 'antd';
import React from 'react';

const FloatingContact = () => {
  return (
    <div className="fixed bottom-[50%] right-8 z-50 flex flex-col gap-4">
      {/* Phone Icon */}
      {/* Zalo Icon */}
      <a
        href="https://zalo.me/0345505829"
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full shadow-lg overflow-hidden border-2 border-white hover:scale-110 transition-transform duration-300 flex items-center justify-center bg-blue-500"
        title="Liên hệ qua Zalo"
      >
        <div className="w-full h-full bg-[#0068FF] text-white flex items-center justify-center font-bold text-[14px]">
          Zalo
        </div>
      </a>

      {/* Facebook Icon */}
      <a
        href="https://m.me/lqson2001"
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full shadow-lg overflow-hidden border-2 border-white hover:scale-110 transition-transform duration-300 flex items-center justify-center bg-white"
        title="Liên hệ qua Facebook"
      >
        <div className="w-full h-full bg-[#0866FF] text-white flex items-center justify-center">
          <svg viewBox="0 0 36 36" fill="currentColor" height="30" width="30">
            <path d="M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1-.8h-4l-1 .8z" fill="#0866FF"></path>
            <path d="M24.4 12.8h-3v-2c0-1.2.7-1.4 1.3-1.4h1.7V5.6s-1.5-.3-3-.3c-3.1 0-5.2 1.9-5.2 5.4v3.1h-2.5v3.8h2.5v11.7h4V16.6h3l.2-3.8z" fill="#FFF"></path>
          </svg>
        </div>
      </a>
      <FloatButton.BackTop visibilityHeight={300} />
    </div>
  );
};

export default FloatingContact;
