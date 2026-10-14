import { Request, Response } from "express";
import * as reportService from "./report.service";
import { getSheetParamsDTO, getSummaryQueryDTO } from "./report.validation";

export const getReportSheet = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getSheetParamsDTO;
  const data = await reportService.getProductionDaySheet(dto);
  return res.json({ data });
};

export const getProductionReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getProductionReport(query);
  return res.json({ data });
};

export const getVariantsProductionReport = async (
  req: Request,
  res: Response,
) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getVariantsProductionReport(query);
  return res.json({ data });
};

export const getItemsProductionReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getItemsProductionReport(query);
  return res.json({ data });
};

export const getVariantsConsumptionReport = async (
  req: Request,
  res: Response,
) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getVariantsConsumptionReport(query);
  return res.json({ data });
};

export const getItemsConsumptionReport = async (
  req: Request,
  res: Response,
) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getItemsConsumptionReport(query);
  return res.json({ data });
};

export const getCustomerReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getCustomerReport(query);
  return res.json({ data });
};

export const getSuppliersReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getSuppliersReport(query);
  return res.json({ data });
};
