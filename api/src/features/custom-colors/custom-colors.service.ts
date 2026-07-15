import { BadRequestException } from "@utils";

import CustomColorsRepository from "./custom-colors.repository";

class CustomColorsService {
  public async getPublic(productId: number): Promise<Record<string, string>> {
    return CustomColorsRepository.findByProduct(productId);
  }

  public async getByStoreAndProduct(
    storeId: number,
    productId: number
  ): Promise<Record<string, string>> {
    return CustomColorsRepository.findByStoreAndProduct(storeId, productId);
  }

  public async save(
    storeId: number,
    productId: number,
    mappings: Record<string, string>
  ): Promise<Record<string, string>> {
    if (!storeId || !productId) {
      throw new BadRequestException("Store and product identifiers are required");
    }

    return CustomColorsRepository.replaceForProduct(storeId, productId, mappings);
  }
}

export default new CustomColorsService();