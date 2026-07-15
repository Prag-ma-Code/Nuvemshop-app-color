import { supabase } from "@config/supabase.client";
import { ICustomColorRecord } from "@repository/UserRepository";

export interface ColorMapping {
  color_hex: string;
  display_name?: string;
}

export interface ColorMappings {
  [variantName: string]: ColorMapping;
}

class CustomColorsRepository {
  public async findByProduct(productId: number): Promise<ColorMappings> {
    const { data } = await supabase
      .from("custom_colors")
      .select("*")
      .eq("product_id", productId);

    return this.toColorMappings(data ?? []);
  }

  public async findByStoreAndProduct(
    storeId: number,
    productId: number
  ): Promise<ColorMappings> {
    const { data } = await supabase
      .from("custom_colors")
      .select("*")
      .eq("store_id", storeId)
      .eq("product_id", productId);

    return this.toColorMappings(data ?? []);
  }

  public async replaceForProduct(
    storeId: number,
    productId: number,
    mappings: ColorMappings
  ): Promise<ColorMappings> {
    await supabase
      .from("custom_colors")
      .delete()
      .eq("store_id", storeId)
      .eq("product_id", productId);

    const records = Object.entries(mappings)
      .filter(([, value]) => Boolean(value.color_hex))
      .map(([variantName, value]) => ({
        store_id: Number(storeId),
        product_id: Number(productId),
        variant_name: variantName.trim(),
        color_hex: value.color_hex.trim(),
        display_name: value.display_name?.trim() || null,
      }));

    if (records.length > 0) {
      await supabase.from("custom_colors").insert(records);
    }

    return this.findByStoreAndProduct(storeId, productId);
  }

  private toColorMappings(
    records: ICustomColorRecord[]
  ): ColorMappings {
    return records.reduce<ColorMappings>(
      (accumulator, record) => {
        accumulator[record.variant_name] = {
          color_hex: record.color_hex,
          display_name: record.display_name || undefined,
        };
        return accumulator;
      },
      {}
    );
  }
}

export default new CustomColorsRepository();
