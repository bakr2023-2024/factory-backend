import { Request, Response } from "express";
import {} from "./customerReturn.service";
import {
  createCustomerReturnBodyDTO,
  deleteCustomerReturnParamsDTO,
  getCustomerReturnParamsDTO,
  paginateCustomerReturnsDTO,
  updateCustomerReturnBodyDTO,
  updateCustomerReturnParamsDTO,
} from "./customerReturn.validation";
import * as customerReturnService from "./customerReturn.service";

export const getCustomerReturns = async (req: Request, res: Response) => {
  const dto: paginateCustomerReturnsDTO = req.query as unknown as paginateCustomerReturnsDTO;
  const result = await customerReturnService.getCustomerReturns(dto);
  return res.json(result);
};
export const getCustomerReturn = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getCustomerReturnParamsDTO;
  const data = await customerReturnService.getCustomerReturn(dto);
  return res.json({ data });
};
export const createCustomerReturn = async (req: Request, res: Response) => {
  const dto = req.body as createCustomerReturnBodyDTO;
  const data = await customerReturnService.createCustomerReturn(dto);
  return res.status(201).json({ data });
};
export const updateCustomerReturn = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateCustomerReturnParamsDTO;
  const body = req.body as updateCustomerReturnBodyDTO;
  const data = await customerReturnService.updateCustomerReturn(params, body);
  return res.json({ data });
};
export const deleteCustomerReturn = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteCustomerReturnParamsDTO;
  const data = await customerReturnService.deleteCustomerReturn(dto);
  return res.json({ data });
};

