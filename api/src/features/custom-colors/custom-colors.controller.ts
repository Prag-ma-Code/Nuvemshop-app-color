import { NextFunction, Request, Response } from "express";

import { StatusCode } from "@utils";

import CustomColorsService from "./custom-colors.service";

class CustomColorsController {
  public getPublic = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const productId = Number(req.query.product_id);
      const data = await CustomColorsService.getPublic(productId);
      return res.status(StatusCode.OK).json(data);
    } catch (error) {
      return next(error);
    }
  };

  public getByProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const productId = Number(req.params.product_id);
      const data = await CustomColorsService.getByStoreAndProduct(
        +req.user.user_id,
        productId
      );
      return res.status(StatusCode.OK).json(data);
    } catch (error) {
      return next(error);
    }
  };

  public save = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const productId = Number(req.body.product_id);
      const mappings = (req.body.mappings ?? {}) as Record<string, string>;
      const data = await CustomColorsService.save(+req.user.user_id, productId, mappings);
      return res.status(StatusCode.OK).json(data);
    } catch (error) {
      return next(error);
    }
  };
}

export default new CustomColorsController();