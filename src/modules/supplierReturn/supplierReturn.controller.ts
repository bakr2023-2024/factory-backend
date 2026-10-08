import { Request, Response } from "express";
import {} from "./supplierReturn.service";
import {
  createSupplierReturnBodyDTO,
  deleteSupplierReturnParamsDTO,
  getSupplierReturnParamsDTO,
  paginateSupplierReturnsDTO,
  updateSupplierReturnBodyDTO,
  updateSupplierReturnParamsDTO,
} from "./supplierReturn.validation";
import * as supplierReturnService from "./supplierReturn.service";

export const getSupplierReturns = async (req: Request, res: Response) => {
  const dto: paginateSupplierReturnsDTO = req.query as unknown as paginateSupplierReturnsDTO;
  const result = await supplierReturnService.getSupplierReturns(dto);
  return res.json(result);
};
export const getSupplierReturn = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getSupplierReturnParamsDTO;
  const data = await supplierReturnService.getSupplierReturn(dto);
  return res.json({ data });
};
export const createSupplierReturn = async (req: Request, res: Response) => {
  const dto = req.body as createSupplierReturnBodyDTO;
  const data = await supplierReturnService.createSupplierReturn(dto);
  return res.status(201).json({ data });
};
export const updateSupplierReturn = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateSupplierReturnParamsDTO;
  const body = req.body as updateSupplierReturnBodyDTO;
  const data = await supplierReturnService.updateSupplierReturn(params, body);
  return res.json({ data });
};
export const deleteSupplierReturn = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteSupplierReturnParamsDTO;
  const data = await supplierReturnService.deleteSupplierReturn(dto);
  return res.json({ data });
};

