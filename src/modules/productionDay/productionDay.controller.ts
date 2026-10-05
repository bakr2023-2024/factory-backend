import { Request, Response } from "express";
import {} from "./productionDay.service";
import {
  createProductionDayBodyDTO,
  deleteProductionDayParamsDTO,
  getProductionDayParamsDTO,
  paginateProductionDaysDTO,
  updateProductionDayBodyDTO,
  updateProductionDayParamsDTO,
} from "./productionDay.validation";
import * as productionDayService from "./productionDay.service";

export const getProductionDays = async (req: Request, res: Response) => {
  const dto: paginateProductionDaysDTO = req.query as unknown as paginateProductionDaysDTO;
  const result = await productionDayService.getProductionDays(dto);
  return res.json(result);
};
export const getProductionDay = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getProductionDayParamsDTO;
  const data = await productionDayService.getProductionDay(dto);
  return res.json({ data });
};
export const createProductionDay = async (req: Request, res: Response) => {
  const dto = req.body as createProductionDayBodyDTO;
  const data = await productionDayService.createProductionDay(dto);
  return res.status(201).json({ data });
};
export const updateProductionDay = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateProductionDayParamsDTO;
  const body = req.body as updateProductionDayBodyDTO;
  const data = await productionDayService.updateProductionDay(params, body);
  return res.json({ data });
};
export const deleteProductionDay = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteProductionDayParamsDTO;
  const data = await productionDayService.deleteProductionDay(dto);
  return res.json({ data });
};

