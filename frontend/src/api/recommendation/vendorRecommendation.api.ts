import request from '../../utils/request';

export type VendorRecommendationRequest = {
  location?: string;
  budget?: number;
  categories?: string[];
  limit?: number;
};

export const getVendorRecommendations = async (
  payload: VendorRecommendationRequest,
  accessToken?: string | null,
) => {
  const token = accessToken ||
    (typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((row) => row.startsWith('access_token='))
          ?.split('=')[1]
      : undefined);

  const response = await request.post('/recommendations/vendors', payload, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  });

  return response.data;
};
