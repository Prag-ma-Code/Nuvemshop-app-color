import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@nimbus-ds/components';
import { useFetch } from '@/hooks';
import { IHomeDataProvider } from './home.types';

const HomeDataProvider: React.FC<IHomeDataProvider> = ({ children }) => {
  const { addToast } = useToast();
  const { request } = useFetch();
  const [totalProducts, setTotalProduts] = useState('0');
  const [isLoading, setIsLoading] = useState({
    totalProducts: false,
    createProduct: false,
  });

  const onGetTotalProducts = useCallback(() => {
    setIsLoading((current) => ({ ...current, totalProducts: true }));
    request<{ total: number }>({
      url: '/products/total',
      method: 'GET',
    })
      .then((response) => {
        setTotalProduts(`${response.content.total}`);
        setIsLoading((current) => ({ ...current, totalProducts: false }));
      })
      .catch((error) => {
        setTotalProduts('0');
        addToast({
          type: 'danger',
          text: error.message.description ?? error.message,
          duration: 4000,
          id: 'error-total-products',
        });
        setIsLoading((current) => ({ ...current, totalProducts: false }));
      });
  }, [addToast, request]);

  const onCreateProduct = useCallback(() => {
    setIsLoading((current) => ({ ...current, createProduct: true }));
    request<{ total: number }>({
      url: '/products',
      method: 'POST',
    })
      .then(() => {
        onGetTotalProducts();
        addToast({
          type: 'success',
          text: 'Produto adicionado com sucesso!',
          duration: 4000,
          id: 'create-product',
        });
        setIsLoading((current) => ({ ...current, createProduct: false }));
      })
      .catch((error) => {
        setTotalProduts('-');
        addToast({
          type: 'danger',
          text: error.message.description ?? error.message,
          duration: 4000,
          id: 'error-create-product',
        });
        setIsLoading((current) => ({ ...current, createProduct: false }));
      });
  }, [addToast, onGetTotalProducts, request]);

  useEffect(() => {
    onGetTotalProducts();
  }, [onGetTotalProducts]);

  return children({ totalProducts, onCreateProduct, isLoading });
};

export default HomeDataProvider;
