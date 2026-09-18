import { Request, Response } from "express";
import {} from "./customer.service";
import {
  createCustomerBodyDTO,
  deleteCustomerParamsDTO,
  getCustomerParamsDTO,
  paginateCustomersDTO,
  updateCustomerBodyDTO,
  updateCustomerParamsDTO,
} from "./customer.validation";
import * as customerService from "./customer.service";

export const getCustomers = async (req: Request, res: Response) => {
  const dto: paginateCustomersDTO = req.query as unknown as paginateCustomersDTO;
  const result = await customerService.getCustomers(dto);
  return res.json(result);
};
export const getCustomer = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getCustomerParamsDTO;
  const data = await customerService.getCustomer(dto);
  return res.json({ data });
};
export const createCustomer = async (req: Request, res: Response) => {
  const dto = req.body as createCustomerBodyDTO;
  const data = await customerService.createCustomer(dto);
  return res.status(201).json({ data });
};
export const updateCustomer = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateCustomerParamsDTO;
  const body = req.body as updateCustomerBodyDTO;
  const data = await customerService.updateCustomer(params, body);
  return res.json({ data });
};
export const deleteCustomer = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteCustomerParamsDTO;
  const data = await customerService.deleteCustomer(dto);
  return res.json({ data });
};

