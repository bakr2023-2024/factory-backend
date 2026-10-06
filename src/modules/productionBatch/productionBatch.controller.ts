import { Request, Response } from "express";
import {} from "./productionBatch.service";
import {
  createProductionBatchBodyDTO,
  deleteProductionBatchParamsDTO,
  getProductionBatchParamsDTO,
  paginateProductionBatchesDTO,
  updateProductionBatchBodyDTO,
  updateProductionBatchParamsDTO,
} from "./productionBatch.validation";
import * as productionBatchService from "./productionBatch.service";

export const getProductionBatches = async (req: Request, res: Response) => {
  const dto: paginateProductionBatchesDTO = req.query as unknown as paginateProductionBatchesDTO;
  const result = await productionBatchService.getProductionBatches(dto);
  return res.json(result);
};
export const getProductionBatch = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getProductionBatchParamsDTO;
  const data = await productionBatchService.getProductionBatch(dto);
  return res.json({ data });
};
export const createProductionBatch = async (req: Request, res: Response) => {
  const dto = req.body as createProductionBatchBodyDTO;
  const data = await productionBatchService.createProductionBatch(dto);
  return res.status(201).json({ data });
};
export const updateProductionBatch = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateProductionBatchParamsDTO;
  const body = req.body as updateProductionBatchBodyDTO;
  const data = await productionBatchService.updateProductionBatch(params, body);
  return res.json({ data });
};
export const deleteProductionBatch = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteProductionBatchParamsDTO;
  const data = await productionBatchService.deleteProductionBatch(dto);
  return res.json({ data });
};

