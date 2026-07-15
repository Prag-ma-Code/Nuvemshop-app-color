import { supabase } from "@config/supabase.client";
import { TiendanubeAuthInterface } from "@features/auth";
import { HttpErrorException } from "@utils";

export interface ICustomColorRecord {
  store_id: number;
  product_id: number;
  variant_name: string;
  color_hex: string;
  display_name?: string;
}

class UserRepository {
  async save(credential: TiendanubeAuthInterface) {
    const { data: existing } = await supabase
      .from("credentials")
      .select("user_id")
      .eq("user_id", credential.user_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("credentials")
        .update(credential)
        .eq("user_id", credential.user_id);
    } else {
      await supabase.from("credentials").insert(credential);
    }
  }

  async findOne(user_id: number) {
    const { data, error } = await supabase
      .from("credentials")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error || !data) {
      throw new HttpErrorException(
        "Read our documentation on how to authenticate your app"
      ).setStatusCode(404);
    }

    return data;
  }

  async findFirst() {
    const { data } = await supabase
      .from("credentials")
      .select("*")
      .limit(1)
      .maybeSingle();

    return data;
  }
}

export default new UserRepository();
