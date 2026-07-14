import { Router } from "express";
import passport from "passport";

import { AuthenticationController } from "@features/auth";
import { ProductController } from "@features/product";
import { CustomColorsController } from "@features/custom-colors";

const routes = Router();
routes.get("/auth/install", AuthenticationController.install);
routes.get("/api/public/custom-colors", CustomColorsController.getPublic);
routes.get(
  "/custom-colors/:product_id",
  passport.authenticate("jwt", { session: false }),
  CustomColorsController.getByProduct
);
routes.put(
  "/custom-colors",
  passport.authenticate("jwt", { session: false }),
  CustomColorsController.save
);
routes.post(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.create
);

routes.get(
  "/products/total",
  passport.authenticate("jwt", { session: false }),
  ProductController.getTotal
);
routes.get(
  "/products",
  passport.authenticate("jwt", { session: false }),
  ProductController.getAll
);
routes.delete(
  "/products/:id",
  passport.authenticate("jwt", { session: false }),
  ProductController.delete
);

export default routes;
