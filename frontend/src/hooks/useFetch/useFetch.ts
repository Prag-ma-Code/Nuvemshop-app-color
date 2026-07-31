import { useCallback } from 'react';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { axios } from '@/app';

import { IApiResponse } from './useFetch.types';

const useFetch = () => {
  const request = useCallback(async <T>(params: AxiosRequestConfig) => {
    let axiosResponse: AxiosResponse<IApiResponse<T>>;
    try {
      axiosResponse = await axios.request({
        ...params,
      });
      return {
        content: axiosResponse?.data as T,
        statusCode: axiosResponse?.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError<IApiResponse<T>>;
      return Promise.reject({
        message: axiosError.response?.data?.message || 'error',
        statusCode: axiosError.response?.status,
      });
    }
  }, []);

  return { request };
};

export default useFetch;
