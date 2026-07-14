import { BadRequestException } from "@utils";

import CustomColorsRepository from "./custom-colors.repository";

class CustomColorsService {
  public getPublic(productId: number): Record<string, string> {
    return CustomColorsRepository.findByProduct(productId);
  }

  public getByStoreAndProduct(
    storeId: number,
    productId: number
  ): Record<string, string> {
    return CustomColorsRepository.findByStoreAndProduct(storeId, productId);
  }

  public save(
    storeId: number,
    productId: number,
    mappings: Record<string, string>
  ): Record<string, string> {
    if (!storeId || !productId) {
      throw new BadRequestException("Store and product identifiers are required");
    }

    return CustomColorsRepository.replaceForProduct(storeId, productId, mappings);
  }
}

export default new CustomColorsService();