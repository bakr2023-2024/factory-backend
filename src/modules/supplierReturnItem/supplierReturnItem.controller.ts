import { Request, Response } from "express";
import {} from "./supplierReturnItem.service";
import {
  createSupplierReturnItemBodyDTO,
  deleteSupplierReturnItemParamsDTO,
  getSupplierReturnItemParamsDTO,
  paginateSupplierReturnItemsDTO,
  updateSupplierReturnItemBodyDTO,
  updateSupplierReturnItemParamsDTO,
} from "./supplierReturnItem.validation";
import * as supplierReturnItemService from "./supplierReturnItem.service";

export const getSupplierReturnItems = async (req: Request, res: Response) => {
  const dto: paginateSupplierReturnItemsDTO = req.query as unknown as paginateSupplierReturnItemsDTO;
  const result = await supplierReturnItemService.getSupplierReturnItems(dto);
  return res.json(result);
};
export const getSupplierReturnItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getSupplierReturnItemParamsDTO;
  const data = await supplierReturnItemService.getSupplierReturnItem(dto);
  return res.json({ data });
};
export const createSupplierReturnItem = async (req: Request, res: Response) => {
  const dto = req.body as createSupplierReturnItemBodyDTO;
  const data = await supplierReturnItemService.createSupplierReturnItem(dto);
  return res.status(201).json({ data });
};
export const updateSupplierReturnItem = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateSupplierReturnItemParamsDTO;
  const body = req.body as updateSupplierReturnItemBodyDTO;
  const data = await supplierReturnItemService.updateSupplierReturnItem(params, body);
  return res.json({ data });
};
export const deleteSupplierReturnItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteSupplierReturnItemParamsDTO;
  const data = await supplierReturnItemService.deleteSupplierReturnItem(dto);
  return res.json({ data });
};

