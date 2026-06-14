import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Typography, Badge, Avatar } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import http from '@/apis/http';
import { jwtDecode } from 'jwt-decode';

const { Text } = Typography;

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [connection, setConnection] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0); // Optional: if you want to track unread

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

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    try {
      await http.post(`/api/Chat/messages`, { message: inputValue });
      setInputValue('');
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn", error);
    }
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
                <div className="font-semibold text-base">Hỗ trợ trực tuyến</div>
                <div className="text-xs text-rose-100">Chúng tôi sẽ trả lời sớm nhất</div>
              </div>
            </div>
            <Button type="text" icon={<CloseOutlined className="text-white" />} onClick={toggleChat} />
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">Bắt đầu trò chuyện với nhân viên hỗ trợ</div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-[#ee4d2d] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                      <div className="text-sm">{msg.message}</div>
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
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <Input 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              placeholder="Nhập tin nhắn..." 
              className="rounded-full"
            />
            <Button 
              type="primary" 
              shape="circle" 
              icon={<SendOutlined />} 
              onClick={handleSend}
              className="bg-[#ee4d2d] hover:bg-[#f05d40] border-none"
            />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Badge count={unreadCount} overflowCount={99}>
        <Button 
          type="primary" 
          shape="circle" 
          size="large"
          className="w-14 h-14 bg-[#ee4d2d] hover:bg-[#f05d40] border-none shadow-lg flex items-center justify-center"
          icon={isOpen ? <CloseOutlined style={{ fontSize: '24px' }}/> : <MessageOutlined style={{ fontSize: '24px' }}/>}
          onClick={toggleChat}
        />
      </Badge>
    </div>
  );
};

export default LiveChatWidget;
