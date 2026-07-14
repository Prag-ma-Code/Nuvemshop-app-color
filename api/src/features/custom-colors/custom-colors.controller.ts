import { NextFunction, Request, Response } from "express";

import { StatusCode } from "@utils";

import CustomColorsService from "./custom-colors.service";

class CustomColorsController {
  public getPublic = (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {
    try {
      const productId = Number(req.query.product_id);
      const data = CustomColorsService.getPublic(productId);
      return res.status(StatusCode.OK).json(data);
    } catch (error) {
      return next(error);
    }
  };

  public getByProduct = (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {
    try {
      const productId = Number(req.params.product_id);
      const data = CustomColorsService.getByStoreAndProduct(
        +req.user.user_id,
        productId
      );
      return res.status(StatusCode.OK).json(data);
    } catch (error) {
      return next(error);
    }
  };

  public save = (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {
    try {
      const productId = Number(req.body.product_id);
      const mappings = (req.body.mappings ?? {}) as Record<string, string>;
      const data = CustomColorsService.save(+req.user.user_id, productId, mappings);
      return res.status(StatusCode.OK).json(data);
    } catch (error) {
      return next(error);
    }
  };
}

export default new CustomColorsController();