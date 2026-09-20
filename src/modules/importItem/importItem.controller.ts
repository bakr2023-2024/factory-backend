import { Request, Response } from "express";
import {} from "./importItem.service";
import {
  createImportItemBodyDTO,
  deleteImportItemParamsDTO,
  getImportItemParamsDTO,
  paginateImportItemsDTO,
  updateImportItemBodyDTO,
  updateImportItemParamsDTO,
} from "./importItem.validation";
import * as importItemService from "./importItem.service";

export const getImportItems = async (req: Request, res: Response) => {
  const dto: paginateImportItemsDTO = req.query as unknown as paginateImportItemsDTO;
  const result = await importItemService.getImportItems(dto);
  return res.json(result);
};
export const getImportItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getImportItemParamsDTO;
  const data = await importItemService.getImportItem(dto);
  return res.json({ data });
};
export const createImportItem = async (req: Request, res: Response) => {
  const dto = req.body as createImportItemBodyDTO;
  const data = await importItemService.createImportItem(dto);
  return res.status(201).json({ data });
};
export const updateImportItem = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateImportItemParamsDTO;
  const body = req.body as updateImportItemBodyDTO;
  const data = await importItemService.updateImportItem(params, body);
  return res.json({ data });
};
export const deleteImportItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteImportItemParamsDTO;
  const data = await importItemService.deleteImportItem(dto);
  return res.json({ data });
};

