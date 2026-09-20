import { Request, Response } from "express";
import {} from "./exportItem.service";
import {
  createExportItemBodyDTO,
  deleteExportItemParamsDTO,
  getExportItemParamsDTO,
  paginateExportItemsDTO,
  updateExportItemBodyDTO,
  updateExportItemParamsDTO,
} from "./exportItem.validation";
import * as exportItemService from "./exportItem.service";

export const getExportItems = async (req: Request, res: Response) => {
  const dto: paginateExportItemsDTO = req.query as unknown as paginateExportItemsDTO;
  const result = await exportItemService.getExportItems(dto);
  return res.json(result);
};
export const getExportItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getExportItemParamsDTO;
  const data = await exportItemService.getExportItem(dto);
  return res.json({ data });
};
export const createExportItem = async (req: Request, res: Response) => {
  const dto = req.body as createExportItemBodyDTO;
  const data = await exportItemService.createExportItem(dto);
  return res.status(201).json({ data });
};
export const updateExportItem = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateExportItemParamsDTO;
  const body = req.body as updateExportItemBodyDTO;
  const data = await exportItemService.updateExportItem(params, body);
  return res.json({ data });
};
export const deleteExportItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteExportItemParamsDTO;
  const data = await exportItemService.deleteExportItem(dto);
  return res.json({ data });
};

