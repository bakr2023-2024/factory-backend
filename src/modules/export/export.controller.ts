import { Request, Response } from "express";
import {} from "./export.service";
import {
  createExportBodyDTO,
  deleteExportParamsDTO,
  getExportParamsDTO,
  paginateExportsDTO,
  updateExportBodyDTO,
  updateExportParamsDTO,
} from "./export.validation";
import * as exportService from "./export.service";

export const getExports = async (req: Request, res: Response) => {
  const dto: paginateExportsDTO = req.query as unknown as paginateExportsDTO;
  const result = await exportService.getExports(dto);
  return res.json(result);
};
export const getExport = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getExportParamsDTO;
  const data = await exportService.getExport(dto);
  return res.json({ data });
};
export const createExport = async (req: Request, res: Response) => {
  const dto = req.body as createExportBodyDTO;
  const data = await exportService.createExport(dto);
  return res.status(201).json({ data });
};
export const updateExport = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateExportParamsDTO;
  const body = req.body as updateExportBodyDTO;
  const data = await exportService.updateExport(params, body);
  return res.json({ data });
};
export const deleteExport = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteExportParamsDTO;
  const data = await exportService.deleteExport(dto);
  return res.json({ data });
};

