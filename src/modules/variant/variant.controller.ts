import { Request, Response } from "express";
import {} from "./variant.service";
import {
  createVariantBodyDTO,
  deleteVariantParamsDTO,
  getVariantParamsDTO,
  paginateVariantsDTO,
  updateVariantBodyDTO,
  updateVariantParamsDTO,
} from "./variant.validation";
import * as variantService from "./variant.service";

export const getVariants = async (req: Request, res: Response) => {
  const dto: paginateVariantsDTO = req.query as unknown as paginateVariantsDTO;
  const result = await variantService.getVariants(dto);
  return res.json(result);
};
export const getVariant = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getVariantParamsDTO;
  const data = await variantService.getVariant(dto);
  return res.json({ data });
};
export const createVariant = async (req: Request, res: Response) => {
  const dto = req.body as createVariantBodyDTO;
  const data = await variantService.createVariant(dto);
  return res.status(201).json({ data });
};
export const updateVariant = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateVariantParamsDTO;
  const body = req.body as updateVariantBodyDTO;
  const data = await variantService.updateVariant(params, body);
  return res.json({ data });
};
export const deleteVariant = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteVariantParamsDTO;
  const data = await variantService.deleteVariant(dto);
  return res.json({ data });
};

