export const getImageUrl = (url: string | undefined | null, type?: "complants" | "messages" ) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // Xóa gạch chéo đầu tiên để nối mượt mà
  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;

  if (type === 'complants' ) {
    return `https://res.cloudinary.com/dss8hptah/image/upload/images/complants/${cleanUrl}`;
  }

  
  if (type === 'messages' ) {
    return `https://res.cloudinary.com/dss8hptah/image/upload/images/messages/${cleanUrl}`;
  }


  if(cleanUrl.startsWith('images/')) {
    cleanUrl = cleanUrl.replace('images/', ''); // Loại bỏ 'images/' nếu đã có
  }

  return `https://res.cloudinary.com/dss8hptah/image/upload/${cleanUrl}`;
};