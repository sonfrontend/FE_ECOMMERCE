import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Typography, Badge, Avatar } from 'antd';
import { CloseOutlined, SendOutlined, UserOutlined, PictureOutlined } from '@ant-design/icons';
import chatIcon from '../assets/icons/chat.png';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import http from '@/apis/http';
import { jwtDecode } from 'jwt-decode';
import { getImageUrl } from '@/utils/imageUrl';

const { Text } = Typography;

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [connection, setConnection] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [sharedProduct, setSharedProduct] = useState<any>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || '';
      setCurrentUserId(userId);
      
      const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role === 'Admin' || role === 'SuperAdmin') {
          return; // Admin không cần hiển thị widget chat này, admin dùng màn hình riêng
      }
    } catch (err) { }
  }, []);

  useEffect(() => {
    const handleShare = (e: any) => {
      setIsOpen(true);
      if (e.detail.product) {
        setSharedProduct(e.detail.product);
      } else {
        const url = e.detail?.productUrl;
        if (url) {
          setInputValue(prev => prev ? `${prev} ${url}` : `I am interested in this product: ${url}`);
        }
      }
    };
    window.addEventListener('share-to-live-chat', handleShare);
    return () => window.removeEventListener('share-to-live-chat', handleShare);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessages = async () => {
      try {
        const res = await http.get(`/api/Chat/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();

    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5000/chatHub", {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .configureLogging(LogLevel.Information)
      .build();

    newConnection.start()
      .then(() => {
        newConnection.invoke("JoinUserGroup", currentUserId);
        
        newConnection.on("ReceiveMessage", (msg: any) => {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          if (!isOpen && msg.senderId !== currentUserId) {
            setUnreadCount(prev => prev + 1);
          }
        });
      })
      .catch(e => console.log('Connection failed: ', e));

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, [currentUserId, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

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
        console.error('Image upload error', error);
        setIsUploading(false);
        return; 
      }
    }

    let textToSend = inputValue;
    let displayMessage = textToSend;
    if (sharedProduct) {
      displayMessage = `__PRODUCT__${JSON.stringify(sharedProduct)}__PRODUCT__\n${textToSend}`.trim();
    }

    try {
      const payload: any = { message: displayMessage };
      if (uploadedImageName) {
        payload.imageName = uploadedImageName;
      }
      await http.post(`/api/Chat/messages`, payload);
      setInputValue('');
      setSharedProduct(null);
      setSelectedImageFile(null);
      setPreviewImageUrl(null);
    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsUploading(false);
    }
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
        }
      }

      // Phân tách tiếp theo URL
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = segment.split(urlRegex);
      return parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={`${index}-${i}`} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`break-all hover:underline ${isMe ? 'text-blue-100' : 'text-[#05a]'}`}
            >
              {part}
            </a>
          );
        }
        return <span key={`${index}-${i}`} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      });
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      // có thể gọi api mark-as-read ở đây
    }
  };

  if (!currentUserId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] h-[450px] bg-white rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-[#ee4d2d] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar icon={<UserOutlined />} className="bg-white text-[#ee4d2d]" />
              <div>
                <div className="font-semibold text-base">Live Support</div>
                <div className="text-xs text-rose-100">We will reply as soon as possible</div>
              </div>
            </div>
            <Button type="text" icon={<CloseOutlined className="text-white" />} onClick={toggleChat} />
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">Start chatting with a support agent</div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-[#ee4d2d] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                      <div className="text-sm">{renderMessageWithLinks(msg.message, isMe)}</div>
                      {msg.imageName && (
                        <div className="mt-2 mb-1 rounded overflow-hidden flex justify-end">
                          <img 
                            src={getImageUrl(msg.imageName)} 
                            alt="attachment" 
                            className="max-w-full rounded-lg max-h-[200px] object-cover"
                          />
                        </div>
                      )}
                      <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-rose-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex flex-col bg-white border-t border-gray-200 p-3 shrink-0">
            {sharedProduct && (
              <div className="px-3 py-2 mb-3 bg-gray-50 rounded-lg flex flex-col border border-gray-100 relative">
                <div className="text-[11px] text-gray-500 mb-1.5 font-medium flex justify-between">
                  <span>Ask Admin about this product</span>
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
                  <span>Attached Image</span>
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

            <div className="flex gap-2 bg-white flex-row items-end">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <Button 
                type="text"
                icon={<PictureOutlined className="text-[20px]" />} 
                onClick={() => fileInputRef.current?.click()} 
                className="text-gray-400 hover:text-gray-500 mb-0.5 px-2"
              />
              <Input.TextArea 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..." 
                className="rounded-xl flex-1 bg-gray-50 focus-within:bg-white"
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ resize: 'none' }}
              />
              <Button 
                type="primary" 
                shape="circle" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                disabled={!inputValue.trim() && !sharedProduct && !selectedImageFile}
                loading={isUploading}
                className="bg-[#ee4d2d] hover:!bg-[#f05d40] border-none shrink-0 mb-0.5"
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
          {isOpen ? <CloseOutlined style={{ fontSize: '24px', color: '#666' }}/> : <img src={chatIcon} alt="Live Chat" className="w-full h-full object-contain drop-shadow-md" />}
        </div>
      </Badge>
    </div>
  );
};

export default LiveChatWidget;
