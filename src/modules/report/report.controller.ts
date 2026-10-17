import { Request, Response } from "express";
import * as reportService from "./report.service";
import { getSheetParamsDTO, getSummaryQueryDTO } from "./report.validation";

export const getReportSheet = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getSheetParamsDTO;
  const data = await reportService.getProductionDaySheet(dto);
  return res.json({ data });
};

export const getVariantsProductionReport = async (
  req: Request,
  res: Response,
) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getVariantsProductionSummary(query);
  return res.json({ data });
};

export const getItemsProductionReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getItemsProductionSummary(query);
  return res.json({ data });
};

export const getVariantsConsumptionReport = async (
  req: Request,
  res: Response,
) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getVariantsConsumptionSummary(query);
  return res.json({ data });
};

export const getItemsConsumptionReport = async (
  req: Request,
  res: Response,
) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getItemsConsumptionSummary(query);
  return res.json({ data });
};

export const getCustomerReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getCustomerSummary(query);
  return res.json({ data });
};

export const getSuppliersReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getSuppliersSummary(query);
  return res.json({ data });
};

export const getRateReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getRateSummary(query);
  return res.json({ data });
};

export const getAttendanceReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getAttendanceSummary(query);
  return res.json({ data });
};

export const getLedgerReport = async (req: Request, res: Response) => {
  const query = req.query as unknown as getSummaryQueryDTO;
  const data = await reportService.getLedgerSummary(query);
  return res.json({ data });
};