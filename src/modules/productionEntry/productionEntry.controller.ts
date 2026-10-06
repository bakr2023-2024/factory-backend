import { Request, Response } from "express";
import {} from "./productionEntry.service";
import {
  createProductionEntryBodyDTO,
  deleteProductionEntryParamsDTO,
  getProductionEntryParamsDTO,
  paginateProductionEntriesDTO,
  updateProductionEntryBodyDTO,
  updateProductionEntryParamsDTO,
} from "./productionEntry.validation";
import * as productionEntryService from "./productionEntry.service";

export const getProductionEntries = async (req: Request, res: Response) => {
  const dto: paginateProductionEntriesDTO = req.query as unknown as paginateProductionEntriesDTO;
  const result = await productionEntryService.getProductionEntries(dto);
  return res.json(result);
};
export const getProductionEntry = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getProductionEntryParamsDTO;
  const data = await productionEntryService.getProductionEntry(dto);
  return res.json({ data });
};
export const createProductionEntry = async (req: Request, res: Response) => {
  const dto = req.body as createProductionEntryBodyDTO;
  const data = await productionEntryService.createProductionEntry(dto);
  return res.status(201).json({ data });
};
export const updateProductionEntry = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateProductionEntryParamsDTO;
  const body = req.body as updateProductionEntryBodyDTO;
  const data = await productionEntryService.updateProductionEntry(params, body);
  return res.json({ data });
};
export const deleteProductionEntry = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteProductionEntryParamsDTO;
  const data = await productionEntryService.deleteProductionEntry(dto);
  return res.json({ data });
};

