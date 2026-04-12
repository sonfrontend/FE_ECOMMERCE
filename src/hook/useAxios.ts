import { useState, useEffect } from 'react';
import http from '@/apis/http'; // File cấu hình axios mình đã tạo ở trên

const useAxios = (url, method = 'get', body = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await http({
          url,
          method,
          data: body
        });
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Đã có lỗi xảy ra!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, method, body]); // Reload nếu url hoặc body thay đổi

  return { data, loading, error };
};

export default useAxios;
