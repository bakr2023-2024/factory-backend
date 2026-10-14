import { Request, Response } from "express";
import {} from "./stockMovement.service";
import {
  getStockMovementParamsDTO,
  paginateStockMovementsDTO,
} from "./stockMovement.validation";
import * as stockMovementService from "./stockMovement.service";

export const getStockMovements = async (req: Request, res: Response) => {
  const dto: paginateStockMovementsDTO = req.query as unknown as paginateStockMovementsDTO;
  const result = await stockMovementService.getStockMovements(dto);
  return res.json(result);
};
export const getStockMovement = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getStockMovementParamsDTO;
  const data = await stockMovementService.getStockMovement(dto);
  return res.json({ data });
};
