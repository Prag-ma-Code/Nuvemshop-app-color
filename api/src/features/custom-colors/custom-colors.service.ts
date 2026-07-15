import { BadRequestException } from "@utils";

import CustomColorsRepository, { ColorMappings } from "./custom-colors.repository";

class CustomColorsService {
  public async getPublic(productId: number): Promise<ColorMappings> {
    return CustomColorsRepository.findByProduct(productId);
  }

  public async getByStoreAndProduct(
    storeId: number,
    productId: number
  ): Promise<ColorMappings> {
    return CustomColorsRepository.findByStoreAndProduct(storeId, productId);
  }

  public async save(
    storeId: number,
    productId: number,
    mappings: ColorMappings
  ): Promise<ColorMappings> {
    if (!storeId || !productId) {
      throw new BadRequestException("Store and product identifiers are required");
    }

    return CustomColorsRepository.replaceForProduct(storeId, productId, mappings);
  }
}

export default new CustomColorsService();
