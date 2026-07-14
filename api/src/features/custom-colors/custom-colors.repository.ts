import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import { ICustomColorRecord } from "@repository/UserRepository";

interface IDatabase {
  credentials: unknown[];
  customColors: ICustomColorRecord[];
}

const adapter = new FileSync<IDatabase>("db.json");
const database = low(adapter);

class CustomColorsRepository {
  public findByProduct(productId: number): Record<string, string> {
    return this.toMap(
      (database.get("customColors").value() ?? []).filter(
        (record) => Number(record.product_id) === Number(productId)
      )
    );
  }

  public findByStoreAndProduct(
    storeId: number,
    productId: number
  ): Record<string, string> {
    return this.toMap(
      (database.get("customColors").value() ?? []).filter(
        (record) =>
          Number(record.store_id) === Number(storeId) &&
          Number(record.product_id) === Number(productId)
      )
    );
  }

  public replaceForProduct(
    storeId: number,
    productId: number,
    mappings: Record<string, string>
  ): Record<string, string> {
    const currentRecords = database.get("customColors").value() ?? [];
    const nextRecords = currentRecords.filter(
      (record) =>
        !(
          Number(record.store_id) === Number(storeId) &&
          Number(record.product_id) === Number(productId)
        )
    );

    Object.entries(mappings)
      .filter(([, colorHex]) => Boolean(colorHex))
      .forEach(([variantName, colorHex]) => {
        nextRecords.push({
          store_id: Number(storeId),
          product_id: Number(productId),
          variant_name: variantName.trim(),
          color_hex: colorHex.trim(),
        });
      });

    database.set("customColors", nextRecords).write();

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