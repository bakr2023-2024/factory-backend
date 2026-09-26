import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateExports = {
  query: fields.paginate("Export").extend({
    customerId: fields.idParam.optional(),
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const getExport = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createExport = {
  body: z.strictObject({
    customerId: fields.idBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateExport = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    customerId: fields.idBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteExport = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateExportsDTO = z.infer<typeof paginateExports.query>;
export type getExportParamsDTO = z.infer<typeof getExport.params>;
export type createExportBodyDTO = z.infer<typeof createExport.body>;
export type updateExportParamsDTO = z.infer<typeof updateExport.params>;
export type updateExportBodyDTO = z.infer<typeof updateExport.body>;
export type deleteExportParamsDTO = z.infer<typeof deleteExport.params>;
