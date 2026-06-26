import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Typography, Badge, Avatar } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, UserOutlined,RobotOutlined, PictureOutlined } from '@ant-design/icons';
import aiIcon from '../assets/icons/ai.svg';
import http from '@/apis/http';
import { jwtDecode } from 'jwt-decode';
import { getImageUrl } from '@/utils/imageUrl';

const { Text } = Typography;

const AiChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      message: 'Xin chào! Tôi là Trợ lý ảo AI của cửa hàng. Tôi có thể giúp bạn kiểm tra đơn hàng, tư vấn size hoặc thông tin sản phẩm.',
      senderId: 'ai',
      createdAt: new Date().toISOString(),
      status: 'sent'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0); 
  const isOpenRef = useRef(isOpen);
  const [isTyping, setIsTyping] = useState(false);
  const [sharedProduct, setSharedProduct] = useState<any | null>(null);
  
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShare = (e: any) => {
      setIsOpen(true);
      if (e.detail.product) {
        setSharedProduct(e.detail.product);
      } else {
        setInputValue(prev => prev ? `${prev} ${e.detail.productUrl}` : e.detail.productUrl);
      }
    };
    window.addEventListener('share-to-chat', handleShare);
    return () => window.removeEventListener('share-to-chat', handleShare);
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || '';
      setCurrentUserId(userId);
      
      const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role === 'Admin' || role === 'SuperAdmin') {
          return; // Admin không hiển thị widget này
      }
    } catch (err) { }
  }, []);

  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setPreviewImageUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !sharedProduct && !selectedImageFile) return;

    let uploadedImageName: string | undefined = undefined;

    if (selectedImageFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('folder', 'images/messages');

      try {
        const uploadRes = await http.post('/api/Chat/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data && uploadRes.data.imageName) {
          uploadedImageName = uploadRes.data.imageName;
        }
      } catch (error) {
        console.error('Lỗi upload ảnh', error);
        setIsUploading(false);
        return; 
      }
    }

    const tempId = `temp_${Date.now()}`;
    let textToSend = inputValue;

    // Hiển thị message ở UI (chứa thẻ tag nếu có product)
    let displayMessage = textToSend;
    let sharedProductId = null;
    if (sharedProduct) {
      displayMessage = `__PRODUCT__${JSON.stringify(sharedProduct)}__PRODUCT__\n${textToSend}`.trim();
      sharedProductId = sharedProduct.id || sharedProduct.productId;
    }
    
    const newMsg = {
      id: tempId,
      message: displayMessage,
      imageName: uploadedImageName,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setSharedProduct(null);
    setSelectedImageFile(null);
    setPreviewImageUrl(null);
    setIsTyping(true);
    setIsUploading(false);

    try {
      // Lấy tối đa 10 tin nhắn gần nhất để làm ngữ cảnh (bỏ qua tin nhắn chào mừng)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          Role: m.senderId === 'ai' ? 'model' : 'user',
          Text: m.message
        }));

      // Gọi API AI
      const payload: any = { 
        message: textToSend,
        history: chatHistory
      };
      if (sharedProductId) {
        payload.sharedProductId = sharedProductId;
      }
      if (uploadedImageName) {
        payload.imageName = uploadedImageName;
      }
      
      const res = await http.post(`/api/AiChat/ask`, payload, { timeout: 60000 });
      const replyText = res.data.reply;
      
      // Update User msg to sent
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
      
      // Add AI reply
      const aiMsg = {
        id: `ai_${Date.now()}`,
        message: replyText,
        senderId: 'ai',
        createdAt: new Date().toISOString(),
        status: 'sent'
      };
      setMessages(prev => [...prev, aiMsg]);
      
      if (!isOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn", error);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const renderMessageWithLinks = (text: string, isMe: boolean) => {
    if (!text) return null;
    const productRegex = /__PRODUCT__(\{.*?\})__PRODUCT__/g;
    const segments = text.split(productRegex);

    return segments.map((segment, index) => {
      if (segment.startsWith('{') && segment.endsWith('}')) {
        try {
          const productObj = JSON.parse(segment);
          return (
            <div key={index} className={`my-1 p-1.5 rounded-lg bg-white border ${isMe ? 'border-blue-200 text-gray-800' : 'border-gray-200 text-gray-800'} shadow-sm text-left flex gap-2 w-full max-w-[220px]`}>
              <div className="w-12 h-12 shrink-0 border border-gray-100 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                <img src={getImageUrl(productObj.image)} alt={productObj.name} className="max-w-full max-h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="text-[12px] font-medium text-gray-800 truncate mb-0.5">{productObj.name}</div>
                <div className="flex items-end gap-1 flex-wrap">
                  <span className="text-[#ee4d2d] font-semibold text-[12px]">{new Intl.NumberFormat('vi-VN').format(productObj.price)}đ</span>
                </div>
              </div>
            </div>
          );
        } catch (e) {
          // Ignore
        }
      }

      // Render text normal
      return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{segment}</span>;
    });
  };

  if (!currentUserId) return null;

  return (
    <div className="fixed bottom-[80px] right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[360px] h-[500px] bg-[#f9fafb] rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] p-4 flex justify-between items-center z-10 shadow-sm text-white">
            <div className="flex items-center gap-4">
              <Avatar icon={<RobotOutlined />} size={36} className="bg-white text-[#ee4d2d]" />
              <div>
                <div className="font-bold text-[15px] leading-tight">Trợ lý ảo AI</div>
                <div className="text-[12px] opacity-90 font-medium">Sẵn sàng hỗ trợ 24/7</div>
              </div>
            </div>
            <Button type="text" icon={<CloseOutlined className="text-white hover:text-gray-200" />} onClick={toggleChat} className="mr-[-8px]" />
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden bg-[#f9fafb] flex flex-col gap-4">
            {messages.map((msg, index) => {
              const isMe = msg.senderId !== 'ai';
              return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
                  {!isMe && <Avatar icon={<RobotOutlined />} size={24} className="bg-blue-100 text-blue-600 mb-5 shrink-0" />}
                  <div className="flex flex-col relative max-w-[85%] min-w-0">
                    <div className={`px-3 py-2 rounded-[18px] relative z-10 shadow-sm text-[13px] break-words ${isMe ? 'bg-blue-50 border border-blue-100 text-blue-900 rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'} ${msg.status === 'sending' ? 'opacity-70' : ''}`}>
                      <div className="leading-relaxed">{renderMessageWithLinks(msg.message, isMe)}</div>
                      {msg.imageName && (
                        <div className="mt-2 mb-1 rounded overflow-hidden flex justify-end">
                          <img 
                            src={getImageUrl(msg.imageName)} 
                            alt="attachment" 
                            className="max-w-full rounded-lg max-h-[200px] object-cover"
                          />
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-blue-400' : 'text-gray-400'}`}>
                        {msg.status === 'sending' ? 'Đang gửi...' : msg.status === 'error' ? 'Lỗi' : new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start items-end gap-2">
                <Avatar icon={<RobotOutlined />} size={24} className="bg-blue-100 text-blue-600 mb-5 shrink-0" />
                <div className="px-4 py-3 bg-white border border-gray-100 rounded-[18px] rounded-bl-sm shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex flex-col bg-white border-t border-gray-100 p-4 shrink-0">
            {sharedProduct && (
              <div className="px-3 py-2 mb-3 bg-gray-50 rounded-lg flex flex-col border border-gray-100 relative">
                <div className="text-[11px] text-gray-500 mb-1.5 font-medium flex justify-between">
                  <span>Hỏi AI về sản phẩm này</span>
                  <CloseOutlined className="cursor-pointer hover:text-gray-800" onClick={() => setSharedProduct(null)} />
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-md border border-gray-100">
                  <div className="w-10 h-10 shrink-0 border border-gray-100 rounded flex justify-center items-center overflow-hidden">
                    <img src={getImageUrl(sharedProduct.image)} alt={sharedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-800 truncate leading-tight">{sharedProduct.name}</div>
                    <div className="flex items-end gap-1 mt-0.5">
                      <span className="text-[#ee4d2d] font-semibold text-[13px]">{new Intl.NumberFormat('vi-VN').format(sharedProduct.price)}đ</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewImageUrl && (
              <div className="px-3 py-2 mb-3 bg-gray-50 rounded-lg flex flex-col border border-gray-100 relative">
                <div className="text-[11px] text-gray-500 mb-1.5 font-medium flex justify-between">
                  <span>Ảnh đính kèm</span>
                  <CloseOutlined 
                    className="cursor-pointer hover:text-gray-800" 
                    onClick={() => {
                      setSelectedImageFile(null);
                      setPreviewImageUrl(null);
                    }} 
                  />
                </div>
                <div className="flex justify-center bg-black/5 rounded-md overflow-hidden relative" style={{ maxHeight: '120px' }}>
                  <img src={previewImageUrl} alt="preview" className="max-h-full object-contain" />
                </div>
              </div>
            )}

            <div className="flex gap-2 items-end bg-gray-50/50 rounded-3xl p-1 border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <Button 
                type="text"
                icon={<PictureOutlined className="text-xl" />} 
                onClick={() => fileInputRef.current?.click()} 
                className="text-gray-400 hover:text-gray-500 mb-0.5 ml-1 px-2"
              />
              <Input.TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Hỏi AI về đơn hàng, size..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ resize: 'none' }}
                className="bg-transparent border-none focus:ring-0 shadow-none text-[13px] py-2 px-1"
              />
              <Button 
                type="primary" 
                icon={<SendOutlined className="text-[12px] ml-0.5" />} 
                onClick={handleSend}
                disabled={!inputValue.trim() && !sharedProduct && !selectedImageFile}
                loading={isTyping || isUploading}
                className="bg-[#ee4d2d] hover:bg-[#d74325] border-none rounded-full h-[36px] w-[36px] min-w-0 flex items-center justify-center mb-0.5 mr-0.5 shadow-sm shrink-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Badge count={unreadCount} overflowCount={99}>
        <div 
          className="w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
          onClick={toggleChat}
        >
          {isOpen ? <CloseOutlined style={{ fontSize: '24px', color: '#666' }}/> : <img src={aiIcon} alt="AI Chat" className="w-full h-full object-contain drop-shadow-md" />}
        </div>
      </Badge>
    </div>
  );
};

export default AiChatWidget;
