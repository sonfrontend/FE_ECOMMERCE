import http from '@/apis/http';
import { message } from 'antd';
import { notificationService } from '@/services/notification.service';
import { addAIHistory } from '@/utils/aiHistory';

export const handleQuickBuy = async (articleId: string, navigate: (path: string, options?: any) => void) => {
  try {
    message.loading({ content: 'Đang xử lý...', key: 'quickBuy' });

    // 1. Fetch product detail to get variants
    const productRes = await http.get(`/api/Product/${articleId}`);
    const productData = productRes.data;

    if (!productData) {
      message.error({ content: 'Không tìm thấy sản phẩm', key: 'quickBuy' });
      return;
    }

    // Default to the first available variant or main product
    const allVars = [productData, ...(productData.products || [])];
    const currentVariant = allVars.find(v => v.stockQuantity > 0) || productData;

    // 2. Add to cart
    await http.post('/api/Cart', {
      articleId: currentVariant.articleId,
      variantId: currentVariant.variantId,
      quantity: 1
    });

    window.dispatchEvent(new Event('cart-updated'));
    addAIHistory(currentVariant.articleId);

    try {
      await notificationService.notifyAdminAction('ADD_TO_CART', `1 x ${currentVariant.articleId} (Quick Buy)`);
    } catch (e) {
      // ignore
    }

    // 3. Find the cart item ID
    const cartRes = await http.get('/api/Cart');
    // Tìm item vừa thêm (ưu tiên lấy từ cuối mảng lên vì vừa mới thêm vào)
    const items = cartRes.data || [];
    const addedItem = items.slice().reverse().find((item: any) => {
      if (currentVariant.color || currentVariant.size) {
        return item.product.articleId === currentVariant.articleId &&
               item.product.color === currentVariant.color &&
               item.product.size === currentVariant.size;
      }
      return item.product.articleId === currentVariant.articleId;
    });

    if (addedItem) {
      message.success({ content: 'Đã thêm vào giỏ hàng', key: 'quickBuy' });
      // 4. Navigate to checkout directly
      navigate('/checkout', { state: { selectedRowKeys: [addedItem.id] } });
    } else {
      message.error({ content: 'Lỗi khi chuẩn bị đơn hàng', key: 'quickBuy' });
    }

  } catch (error: any) {
    message.error({ content: error.message || 'Vui lòng đăng nhập để mua hàng!', key: 'quickBuy' });
  }
};
