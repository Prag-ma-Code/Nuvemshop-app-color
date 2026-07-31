import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@nimbus-ds/components';
import { useFetch } from '@/hooks';
import { IProduct, IProductsDataProvider } from './products.types';

const ProductsDataProvider: React.FC<IProductsDataProvider> = ({
  children,
}) => {
  const { addToast } = useToast();
  const { request } = useFetch();
  const [products, setProduts] = useState<IProduct[]>([]);

  const onGetProducts = useCallback(() => {
    request<IProduct[]>({
      url: `/products`,
      method: 'GET',
    })
      .then((response) => {
        setProduts(response.content);
      })
      .catch((error) => {
        addToast({
          type: 'danger',
          text: error.message.description ?? error.message,
          duration: 4000,
          id: 'error-products',
        });
      });
  }, [addToast, request]);

  const onDeleteProduct = useCallback(
    (productId: number) => {
      request<IProduct[]>({
        url: `/products/${productId}`,
        method: 'DELETE',
      })
        .then(() => {
          onGetProducts();
          addToast({
            type: 'success',
            text: 'Produto deletado com sucesso',
            duration: 4000,
            id: 'delete-product',
          });
        })
        .catch((error) => {
          addToast({
            type: 'danger',
            text: error.message.description ?? error.message,
            duration: 4000,
            id: 'error-delete-product',
          });
        });
    },
    [addToast, onGetProducts, request],
  );

  useEffect(() => {
    onGetProducts();
  }, [onGetProducts]);

  return children({ products, onDeleteProduct });
};

export default ProductsDataProvider;
