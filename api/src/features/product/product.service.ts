import { generateProductMock } from "@features/product/__mock__/product.mock";
import { tiendanubeApiClient } from "@config";
import { IProductRequest, IProductResponse } from "@features/product";

class ProductService {
  async create(user_id: number): Promise<IProductResponse> {
    const randomProduct: IProductRequest = generateProductMock();
    const data: IProductResponse = await tiendanubeApiClient.post(
      `${user_id}/products`,
      randomProduct
    );

    return {
      id: data.id,
      ...randomProduct,
    } as IProductResponse;
  }

  async delete(user_id: number, productId: string): Promise<any> {
    return await tiendanubeApiClient.delete(`${user_id}/products/${productId}`);
  }

  async findAll(user_id: number): Promise<IProductResponse[]> {
    return this.findAllFromApi(user_id);
  }

  async findAllCount(user_id: number): Promise<{ total: number }> {
    return {
      total: (await this.findAllFromApi(user_id)).length,
    };
  }

  private async findAllFromApi(user_id: number): Promise<IProductResponse[]> {
    const perPage = 200;
    let page = 1;
    let allProducts: IProductResponse[] = [];
    let products: IProductResponse[];

    do {
      products = (await tiendanubeApiClient.get(
        `${user_id}/products?page=${page}&per_page=${perPage}`
      )) as IProductResponse[];
      allProducts = allProducts.concat(products);
      page++;
    } while (products.length > 0);

    return allProducts;
  }
}

export default new ProductService();
