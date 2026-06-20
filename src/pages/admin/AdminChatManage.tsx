import React, { useState, useEffect, useRef } from 'react';
import { Typography, List, Avatar, Input, Button, Badge, Spin, Select } from 'antd';
import { SendOutlined, UserOutlined, MessageOutlined, PictureOutlined ,CloseOutlined} from '@ant-design/icons';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import http from '@/apis/http';
import { jwtDecode } from 'jwt-decode';
import { getImageUrl } from '@/utils/imageUrl';

const { Title, Text } = Typography;

const AdminChatManage: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentAdminId, setCurrentAdminId] = useState<string>('');
  const [connection, setConnection] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserIdRef = useRef(selectedUserId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentAdminId(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.sub || '');
      } catch (err) { }
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await http.get('/api/Chat/conversations');
      setConversations(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách hội thoại", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await http.get('/api/User');
      setAllUsers(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách user", error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
    
    // Connect to Hub
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5000/chatHub", {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .configureLogging(LogLevel.Information)
      .build();

    newConnection.on("ReceiveMessage", (msg: any) => {
      // Update conversations list (move to top, update last message, inc unread if not selected)
      setConversations(prev => {
         let exists = false;
         let updated = prev.map(c => {
             if (c.userId.toLowerCase() === msg.userId.toLowerCase()) {
                 exists = true;
                 return {
                     ...c,
                     lastMessage: msg.message,
                     lastMessageAt: msg.createdAt,
                     unreadCount: (selectedUserIdRef.current?.toLowerCase() !== msg.userId.toLowerCase() && !msg.isAdmin) ? c.unreadCount + 1 : c.unreadCount
                 };
             }
             return c;
         });
         
         if (!exists && !msg.isAdmin) {
             updated.push({
                 userId: msg.userId,
                 userName: msg.senderName,
                 lastMessage: msg.message,
                 lastMessageAt: msg.createdAt,
                 unreadCount: selectedUserIdRef.current?.toLowerCase() === msg.userId.toLowerCase() ? 0 : 1
             });
         }
         
         return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });

      // Update messages if this is the active chat
      setMessages(prev => {
        if (prev.length > 0 && prev[0].userId.toLowerCase() === msg.userId.toLowerCase()) {
           if (prev.find(m => m.id === msg.id)) return prev;
           // Ignore if it's our own optimistic message (admin sent it)
           if (msg.isAdmin) return prev;
           return [...prev, msg];
        }
        return prev;
      });
    });

    newConnection.start()
      .then(() => {
        newConnection.invoke("JoinUserGroup", "AdminGroup"); // Lắng nghe tất cả tin nhắn mới nếu backend gửi vào group này (hoặc tự refresh)
      })
      .catch(e => console.log('Connection failed: ', e));

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  const fetchMessages = async (userId: string) => {
    try {
      const res = await http.get(`/api/Chat/messages?targetUserId=${userId}`);
      setMessages(res.data);
      
      // Mark as read
      await http.post('/api/Chat/mark-read', `"${userId}"`, {
          headers: { 'Content-Type': 'application/json' }
      });
      
      setConversations(prev => prev.map(c => c.userId === userId ? {...c, unreadCount: 0} : c));
    } catch (error) {
      console.error("Lỗi lấy tin nhắn", error);
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    fetchMessages(userId);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedImageFile) return;

    if (!selectedUserId) return;

    setIsUploading(true);
    let uploadedImageName: string | undefined = undefined;

    if (selectedImageFile) {
      const formData = new FormData();
      formData.append('file', selectedImageFile);
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
        return; // Dừng nếu upload ảnh lỗi
      }
    }

    const tempId = `temp_${Date.now()}`;
    const textToSend = inputValue;

    const tempMsg = {
      id: tempId,
      message: textToSend,
      imageName: uploadedImageName,
      senderId: currentAdminId,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      status: 'sending',
      replyToId: replyingToMessage?.id,
      replyToMessage: replyingToMessage?.message,
      replyToSenderName: replyingToMessage?.senderName
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputValue('');
    setSelectedImageFile(null);
    setPreviewImageUrl(null);
    setReplyingToMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const payload: any = { message: textToSend, targetUserId: selectedUserId };
      if (uploadedImageName) payload.imageName = uploadedImageName;
      if (tempMsg.replyToId) payload.replyToId = tempMsg.replyToId;

      const res = await http.post(`/api/Chat/messages`, payload);
      const realMsg = res.data;

      setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, status: 'sent' } : m));
      
      // Update last message in conversations list
      setConversations(prev => {
         return prev.map(c => {
             if (c.userId === selectedUserId) {
                 return {
                     ...c,
                     lastMessage: realMsg.message,
                     lastMessageAt: realMsg.createdAt
                 };
             }
             return c;
         }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
      
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn", error);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
  };

  const removePreviewImage = () => {
    setSelectedImageFile(null);
    setPreviewImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatMessageText = (text: string) => {
    if (!text) return text;
    const productRegex = /__PRODUCT__(\{.*?\})__PRODUCT__/g;
    return text.replace(productRegex, (match, jsonString) => {
      try {
        const product = JSON.parse(jsonString);
        return `[Sản phẩm] ${product.name} `;
      } catch (e) {
        return `[Sản phẩm] `;
      }
    });
  };

  const renderMessageWithLinks = (text: string, isMe: boolean) => {
    // 1. Phân tách theo thẻ __PRODUCT__
    const productRegex = /__PRODUCT__(\{.*?\})__PRODUCT__/g;
    const segments = text.split(productRegex);

    return segments.map((segment, index) => {
      // Kiểm tra xem đoạn này có phải là JSON của product không
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
                  {productObj.originalPrice > productObj.price && (
                    <span className="text-gray-400 text-[10px] line-through">{new Intl.NumberFormat('vi-VN').format(productObj.originalPrice)}đ</span>
                  )}
                </div>
              </div>
            </div>
          );
        } catch (e) {
          // Bỏ qua nếu parse lỗi
        }
      }

      // 2. Phân tách tiếp theo URL
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
              className={`break-all hover:underline ${isMe ? 'text-blue-700 font-medium' : 'text-[#05a]'}`}
            >
              {part}
            </a>
          );
        }
        return <span key={`${index}-${i}`}>{part}</span>;
      });
    });
  };

  return (
    <div className='bg-white w-full h-[calc(100vh-184px)] flex overflow-hidden'>
      {/* Left side: Conversations */}
      <div className="w-[320px] border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shrink-0">
          <Title level={4} className="m-0 text-gray-800 font-bold">Trò chuyện</Title>
          <Select
            showSearch
            placeholder="Tìm người dùng để nhắn tin..."
            style={{ width: '100%' }}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
            }
            options={allUsers.map(u => ({ value: u.userId, label: u.fullName || u.userName }))}
            value={null}
            onChange={(userId) => {
              const existing = conversations.find(c => c.userId === userId);
              if (!existing) {
                const user = allUsers.find(u => u.userId === userId);
                if (user) {
                  setConversations(prev => [{
                    userId: user.userId,
                    userName: user.fullName || user.userName,
                    lastMessage: '',
                    lastMessageAt: new Date().toISOString(),
                    unreadCount: 0
                  }, ...prev]);
                }
              }
              handleSelectConversation(userId);
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <List
            dataSource={conversations}
            renderItem={(item) => (
              <List.Item 
                className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${selectedUserId === item.userId ? 'bg-gray-50 border-r-2 border-r-gray-200' : ''}`}
                onClick={() => handleSelectConversation(item.userId)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={item.unreadCount} size="small" className="mt-1 mr-2">
                      <Avatar icon={<UserOutlined />} src={item.avatarUrl} size={38} className="bg-gray-100 text-gray-400" />
                    </Badge>
                  }
                  title={<div className="font-medium text-[15px] text-gray-800 mb-0.5">Tên: {item.userName}</div>}
                  className="px-2"
                  description={
                    <div className="truncate text-gray-500 text-[13px]">
                      Tin nhắn: {formatMessageText(item.lastMessage)}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </div>

      {/* Right side: Chat Window */}
      <div className="flex-1 flex flex-col bg-[#f9fafb]">
        {selectedUserId ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center shadow-sm z-10 gap-2">
              <Avatar icon={<UserOutlined />} size={36} className="mr-5 bg-gray-100 text-gray-400" />
              <div className="">
                <div className="font-medium text-[16px] text-gray-800 leading-tight">{conversations.find(c => c.userId === selectedUserId)?.userName}</div>
                <div className="text-[12px] text-green-500">Đang hoạt động</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-4">
              {messages.map((msg, index) => {
                const isMe = msg.isAdmin;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-end gap-2`}>
                    {!isMe && <Avatar icon={<UserOutlined />} size={28} className="bg-gray-200 text-gray-500 mb-5 shrink-0" />}
                    <div className="flex flex-col relative max-w-[75%] min-w-0">
                      {msg.replyToMessage && (
                        <div className={`text-[11px] px-3 py-2 rounded-t-xl mb-[-10px] pb-4 ${isMe ? 'bg-[#ffecd9] text-orange-800' : 'bg-gray-200 text-gray-600'} opacity-90 break-words`}>
                          <div className="font-medium text-[10px] mb-0.5 opacity-70">{msg.replyToSenderName || 'Tin nhắn'}</div>
                          <div className="line-clamp-2">{formatMessageText(msg.replyToMessage)}</div>
                        </div>
                      )}

                      <div className={`px-3 py-2 rounded-[18px] relative z-10 shadow-sm text-[13px] break-words ${isMe ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'} ${msg.status === 'sending' ? 'opacity-70' : ''}`}>
                        {msg.imageName && (
                          <div className="mb-2">
                            <img 
                              src={`https://res.cloudinary.com/dss8hptah/image/upload/images/messages/${msg.imageName}`} 
                              alt="attachment" 
                              className="max-w-full rounded-lg max-h-[250px] object-cover"
                            />
                          </div>
                        )}
                        {msg.message && <div className="leading-relaxed">{renderMessageWithLinks(msg.message, isMe)}</div>}
                        <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-blue-400' : 'text-gray-400'}`}>
                          {msg.status === 'sending' ? 'Đang gửi...' : msg.status === 'error' ? 'Lỗi' : new Date(msg.createdAt).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}
                        </div>
                      </div>
                    </div>
                    {/* Nút reply */}
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity mb-5 ${isMe ? 'order-first mr-2' : 'ml-2'}`}>
                      <Button 
                        type="text" 
                        icon={<MessageOutlined />} 
                        size="small" 
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setReplyingToMessage({
                          id: msg.id,
                          message: msg.message || '[Hình ảnh]',
                          senderName: isMe ? 'Bạn' : (conversations.find(c => c.userId === selectedUserId)?.userName || 'Khách hàng')
                        })}
                      />
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex flex-col bg-white border-t border-gray-100 p-4 shrink-0">
              {replyingToMessage && (
              <div className="px-4 py-2 mb-3 bg-gray-50 rounded-lg flex justify-between items-center text-[12px] text-gray-600 border border-gray-100">
                <div className="truncate flex-1 pr-4 border-l-2 border-gray-200 pl-2">
                  <span className="font-medium mr-1 text-gray-800">Trả lời:</span>
                  {replyingToMessage.message?.replace(/\n/g, ' ')}
                </div>
                <Button type="text" icon={<CloseOutlined />} onClick={() => setReplyingToMessage(null)} size="small" className="text-gray-400 hover:text-gray-600" />
              </div>
            )}

              {previewImageUrl && (
                <div className="px-2 py-2 mb-3 relative inline-block">
                  <div className="relative inline-block border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
                    <img src={previewImageUrl} alt="preview" className="h-16 rounded object-cover" />
                    <Button 
                      type="primary" 
                      danger 
                      shape="circle" 
                      icon={<CloseOutlined />} 
                      size="small" 
                      className="absolute -top-2 -right-2 w-5 h-5 min-w-0"
                      onClick={removePreviewImage}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 items-end bg-gray-50/50 rounded-3xl p-1.5 border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-colors">
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
                  className="text-gray-400 hover:text-gray-500 mb-0.5 ml-1"
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
                  placeholder="Nhập tin nhắn..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ resize: 'none' }}
                  className="bg-transparent border-none focus:ring-0 shadow-none text-[13px] py-2 px-1"
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />} 
                  onClick={handleSend}
                  disabled={!inputValue.trim() && !selectedImageFile}
                  loading={isUploading}
                  className="bg-[#ee4d2d] hover:bg-[#d74325] border-none rounded-full h-[36px] w-[36px] min-w-0 flex items-center justify-center mb-0.5 mr-0.5"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
             <MessageOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
             <span>Chọn một cuộc hội thoại để bắt đầu nhắn tin</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatManage;
