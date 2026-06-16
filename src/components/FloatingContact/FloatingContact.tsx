import React, { useState, useEffect } from 'react';
import fbIcon from '../../assets/icons/fb.svg';
import scrollIcon from '../../assets/icons/scroll.png';
import zlIcon from '../../assets/icons/zl.svg';
import LiveChatWidget from '../LiveChatWidget';
import AiChatWidget from '../AiChatWidget';

const FloatingContact = () => {
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackTop(true);
      } else {
        setShowBackTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="fixed bottom-[136px] right-6 z-50 flex flex-col-reverse gap-2">
      {/* Zalo Icon */}
      <a
        href="https://zalo.me/0345505829"
        target="_blank"
        rel="noopener noreferrer"
        title="Liên hệ qua Zalo"
      >
        <div className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
          <img src={zlIcon} alt="Zalo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
      </a>

      {/* Facebook Icon */}
      <a
        href="https://m.me/lqson2001"
        target="_blank"
        rel="noopener noreferrer"
        title="Liên hệ qua Facebook"
      >
        <div className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
          <img src={fbIcon} alt="Facebook" className="w-full h-full object-contain drop-shadow-md" />
        </div>
      </a>
      </div>
      
      {/* Custom BackTop Button */}
      {showBackTop && (
        <div 
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
        >
          <img src={scrollIcon} alt="Cuộn lên trên" className="w-full h-full object-contain drop-shadow-md" />
        </div>
      )}
      <AiChatWidget />
      <LiveChatWidget />
    </>
  );
};

export default FloatingContact;
