import { Request, Response } from "express";
import {} from "./customerReturnItem.service";
import {
  createCustomerReturnItemBodyDTO,
  deleteCustomerReturnItemParamsDTO,
  getCustomerReturnItemParamsDTO,
  paginateCustomerReturnItemsDTO,
  updateCustomerReturnItemBodyDTO,
  updateCustomerReturnItemParamsDTO,
} from "./customerReturnItem.validation";
import * as customerReturnItemService from "./customerReturnItem.service";

export const getCustomerReturnItems = async (req: Request, res: Response) => {
  const dto: paginateCustomerReturnItemsDTO = req.query as unknown as paginateCustomerReturnItemsDTO;
  const result = await customerReturnItemService.getCustomerReturnItems(dto);
  return res.json(result);
};
export const getCustomerReturnItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getCustomerReturnItemParamsDTO;
  const data = await customerReturnItemService.getCustomerReturnItem(dto);
  return res.json({ data });
};
export const createCustomerReturnItem = async (req: Request, res: Response) => {
  const dto = req.body as createCustomerReturnItemBodyDTO;
  const data = await customerReturnItemService.createCustomerReturnItem(dto);
  return res.status(201).json({ data });
};
export const updateCustomerReturnItem = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateCustomerReturnItemParamsDTO;
  const body = req.body as updateCustomerReturnItemBodyDTO;
  const data = await customerReturnItemService.updateCustomerReturnItem(params, body);
  return res.json({ data });
};
export const deleteCustomerReturnItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteCustomerReturnItemParamsDTO;
  const data = await customerReturnItemService.deleteCustomerReturnItem(dto);
  return res.json({ data });
};

