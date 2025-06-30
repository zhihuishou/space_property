// src/api/api.ts
import axios from 'axios';

export const fetchLayoutData = async (commonCode = '2500') => {
  const response = await axios.get(
    `https://vip-gateway.wywk.cn/asset-web/shop/layout/get?commonCode=${commonCode}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};