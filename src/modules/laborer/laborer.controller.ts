import { Request, Response } from "express";
import {} from "./laborer.service";
import {
  createLaborerBodyDTO,
  deleteLaborerParamsDTO,
  getLaborerParamsDTO,
  paginateLaborersDTO,
  updateLaborerBodyDTO,
  updateLaborerParamsDTO,
} from "./laborer.validation";
import * as laborerService from "./laborer.service";

export const getLaborers = async (req: Request, res: Response) => {
  const dto: paginateLaborersDTO = req.query as unknown as paginateLaborersDTO;
  const result = await laborerService.getLaborers(dto);
  return res.json(result);
};
export const getLaborer = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getLaborerParamsDTO;
  const data = await laborerService.getLaborer(dto);
  return res.json({ data });
};
export const createLaborer = async (req: Request, res: Response) => {
  const dto = req.body as createLaborerBodyDTO;
  const data = await laborerService.createLaborer(dto);
  return res.status(201).json({ data });
};
export const updateLaborer = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateLaborerParamsDTO;
  const body = req.body as updateLaborerBodyDTO;
  const data = await laborerService.updateLaborer(params, body);
  return res.json({ data });
};
export const deleteLaborer = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteLaborerParamsDTO;
  const data = await laborerService.deleteLaborer(dto);
  return res.json({ data });
};

