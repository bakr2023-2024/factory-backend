import { Request, Response } from "express";
import {} from "./supplier.service";
import {
  createSupplierBodyDTO,
  deleteSupplierParamsDTO,
  getSupplierParamsDTO,
  paginateSuppliersDTO,
  updateSupplierBodyDTO,
  updateSupplierParamsDTO,
} from "./supplier.validation";
import * as supplierService from "./supplier.service";

export const getSuppliers = async (req: Request, res: Response) => {
  const dto: paginateSuppliersDTO = req.query as unknown as paginateSuppliersDTO;
  const result = await supplierService.getSuppliers(dto);
  return res.json(result);
};
export const getSupplier = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getSupplierParamsDTO;
  const data = await supplierService.getSupplier(dto);
  return res.json({ data });
};
export const createSupplier = async (req: Request, res: Response) => {
  const dto = req.body as createSupplierBodyDTO;
  const data = await supplierService.createSupplier(dto);
  return res.status(201).json({ data });
};
export const updateSupplier = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateSupplierParamsDTO;
  const body = req.body as updateSupplierBodyDTO;
  const data = await supplierService.updateSupplier(params, body);
  return res.json({ data });
};
export const deleteSupplier = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteSupplierParamsDTO;
  const data = await supplierService.deleteSupplier(dto);
  return res.json({ data });
};

