import { Request, Response } from "express";
import {} from "./import.service";
import {
  createImportBodyDTO,
  deleteImportParamsDTO,
  getImportParamsDTO,
  paginateImportsDTO,
  updateImportBodyDTO,
  updateImportParamsDTO,
} from "./import.validation";
import * as importService from "./import.service";

export const getImports = async (req: Request, res: Response) => {
  const dto: paginateImportsDTO = req.query as unknown as paginateImportsDTO;
  const result = await importService.getImports(dto);
  return res.json(result);
};
export const getImport = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getImportParamsDTO;
  const data = await importService.getImport(dto);
  return res.json({ data });
};
export const createImport = async (req: Request, res: Response) => {
  const dto = req.body as createImportBodyDTO;
  const data = await importService.createImport(dto);
  return res.status(201).json({ data });
};
export const updateImport = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateImportParamsDTO;
  const body = req.body as updateImportBodyDTO;
  const data = await importService.updateImport(params, body);
  return res.json({ data });
};
export const deleteImport = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteImportParamsDTO;
  const data = await importService.deleteImport(dto);
  return res.json({ data });
};

