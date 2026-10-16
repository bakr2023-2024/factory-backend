import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateExports = {
  query: fields.paginate("Export").extend({
    productionDayId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    customerId: fields.integerParam.optional(),
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const getExport = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createExport = {
  body: z.strictObject({
    productionDayId: fields.integerBody,
    customerId: fields.integerBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateExport = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    productionDayId: fields.integerBody.optional(),
    customerId: fields.integerBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteExport = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateExportsDTO = z.infer<typeof paginateExports.query>;
export type getExportParamsDTO = z.infer<typeof getExport.params>;
export type createExportBodyDTO = z.infer<typeof createExport.body>;
export type updateExportParamsDTO = z.infer<typeof updateExport.params>;
export type updateExportBodyDTO = z.infer<typeof updateExport.body>;
export type deleteExportParamsDTO = z.infer<typeof deleteExport.params>;
export const exportRules: FilterRule<paginateExportsDTO>[] = [
  { path: ["productionDayId"], param: "productionDayId" },
  { path: ["productionDay", "productionDate"], param: "productionDate" },
  { path: ["customerId"], param: "customerId" },
  { path: ["customer", "name"], param: "customerName", op: "contains" },
  { path: ["customer", "number"], param: "customerNumber", op: "contains" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];