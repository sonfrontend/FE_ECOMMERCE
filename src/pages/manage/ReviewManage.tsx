import React, { useState, useEffect } from 'react';
import { Tabs, List, Button, Typography, Spin, Modal, Form, Input, Rate, message, Avatar } from 'antd';
import http from '@/apis/http';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { getImageUrl } from '@/utils/imageUrl';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function ReviewManage() {
  const [activeTab, setActiveTab] = useState('1');
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentReviewItem, setCurrentReviewItem] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchPendingReviews = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Review/pending-reviews');
      setPendingReviews(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const res = await http.get('/api/Review/my-reviews');
      setMyReviews(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === '1') fetchPendingReviews();
    else fetchMyReviews();
  }, [activeTab]);

  const handleOpenReviewModal = (item: any) => {
    setCurrentReviewItem(item);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmitReview = async (values: any) => {
    try {
      await http.post('/api/Review', {
        productId: currentReviewItem.productId,
        orderItemId: currentReviewItem.orderItemId,
        rating: values.rating,
        comment: values.comment
      });
      message.success('Đánh giá thành công!');
      setIsModalVisible(false);
      fetchPendingReviews();
    } catch (error: any) {
      message.error(error.response?.data || 'Lỗi khi đánh giá');
    }
  };

  return (
    <div className='p-6 bg-white rounded-lg shadow-sm min-h-[500px]'>
      <Title level={4} className='mb-4'>Đánh giá của tôi</Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={`Chờ đánh giá (${pendingReviews.length})`} key="1">
          <Spin spinning={loading}>
            <List
              itemLayout="horizontal"
              dataSource={pendingReviews}
              locale={{ emptyText: 'Bạn không có sản phẩm nào chờ đánh giá.' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type='primary' onClick={() => handleOpenReviewModal(item)}>Đánh giá ngay</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={getImageUrl(item.productImage)} shape="square" size={64} />}
                    title={<Link to={`/product/${item.productId}`}>{item.productName}</Link>}
                    description={
                      <div>
                        <div className="text-gray-500">Phân loại: {item.variantName}</div>
                        <div className="text-gray-500">Giao hàng thành công: {dayjs(item.deliveredDate || item.orderDate).format('DD/MM/YYYY HH:mm')}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Spin>
        </TabPane>

        <TabPane tab={`Đã đánh giá (${myReviews.length})`} key="2">
          <Spin spinning={loading}>
            <List
              itemLayout="horizontal"
              dataSource={myReviews}
              locale={{ emptyText: 'Bạn chưa có đánh giá nào.' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.productImage} shape="square" size={64} />}
                    title={<Link to={`/product/${item.productId}`}>{item.productName}</Link>}
                    description={
                      <div className='mt-2'>
                        <Rate disabled defaultValue={item.rating} className='text-sm mb-1' />
                        <div className='text-gray-800'>{item.comment}</div>
                        <div className='text-gray-400 text-xs mt-2'>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Spin>
        </TabPane>
      </Tabs>

      <Modal
        title="Đánh giá sản phẩm"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {currentReviewItem && (
          <div className='flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded'>
            <img src={currentReviewItem.productImage} alt='product' className='w-12 h-12 object-cover rounded' />
            <div>
              <div className='font-medium'>{currentReviewItem.productName}</div>
              <div className='text-gray-500 text-sm'>Phân loại: {currentReviewItem.variantName}</div>
            </div>
          </div>
        )}
        <Form form={form} layout='vertical' onFinish={handleSubmitReview} initialValues={{ rating: 5 }}>
          <Form.Item name='rating' label='Chất lượng sản phẩm' rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name='comment' label='Bình luận' rules={[{ required: true, message: 'Vui lòng nhập bình luận' }]}>
            <Input.TextArea placeholder='Hãy chia sẻ cảm nhận của bạn về sản phẩm nhé' rows={4} />
          </Form.Item>
          <div className='flex justify-end gap-2 mt-4'>
            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
            <Button type='primary' htmlType='submit'>Gửi đánh giá</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
