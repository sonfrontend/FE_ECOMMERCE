

export const getImageUrl = (url: string | undefined | null, type?: 'images') => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // Xóa gạch chéo đầu tiên để nối mượt mà
  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;

  // Nếu url đã chứa sẵn thư mục (VD: images/products/abc.jpg)
  if (type === 'images') {
    return `https://res.cloudinary.com/dss8hptah/image/upload/images/${cleanUrl}`;
  }

  // Nếu là ảnh cũ (chỉ có abc.jpg), mặc định thư mục gốc của nó trên Cloudinary là images/
  return `https://res.cloudinary.com/dss8hptah/image/upload/${cleanUrl}`;
};