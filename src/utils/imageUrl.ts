export const getImageUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // Xóa gạch chéo đầu tiên để nối mượt mà
  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;

if (cleanUrl.startsWith('images/')) {
    cleanUrl = cleanUrl.replace('images/', '');
  }  
  return `https://res.cloudinary.com/dss8hptah/image/upload/${cleanUrl}`;
};