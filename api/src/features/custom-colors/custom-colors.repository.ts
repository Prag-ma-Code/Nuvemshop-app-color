import { supabase } from "@config/supabase.client";
import { ICustomColorRecord } from "@repository/UserRepository";

class CustomColorsRepository {
  public async findByProduct(productId: number): Promise<Record<string, string>> {
    const { data } = await supabase
      .from("custom_colors")
      .select("*")
      .eq("product_id", productId);

    return this.toMap(data ?? []);
  }

  public async findByStoreAndProduct(
    storeId: number,
    productId: number
  ): Promise<Record<string, string>> {
    const { data } = await supabase
      .from("custom_colors")
      .select("*")
      .eq("store_id", storeId)
      .eq("product_id", productId);

    return this.toMap(data ?? []);
  }

  public async replaceForProduct(
    storeId: number,
    productId: number,
    mappings: Record<string, string>
  ): Promise<Record<string, string>> {
    await supabase
      .from("custom_colors")
      .delete()
      .eq("store_id", storeId)
      .eq("product_id", productId);

    const records = Object.entries(mappings)
      .filter(([, colorHex]) => Boolean(colorHex))
      .map(([variantName, colorHex]) => ({
        store_id: Number(storeId),
        product_id: Number(productId),
        variant_name: variantName.trim(),
        color_hex: colorHex.trim(),
      }));

    if (records.length > 0) {
      await supabase.from("custom_colors").insert(records);
    }

    return this.findByStoreAndProduct(storeId, productId);
  }

  private toMap(records: ICustomColorRecord[]): Record<string, string> {
    return records.reduce<Record<string, string>>((accumulator, record) => {
      accumulator[record.variant_name] = record.color_hex;
      return accumulator;
    }, {});
  }
}

export default new CustomColorsRepository();
