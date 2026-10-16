import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateImports = {
  query: fields.paginate("Import").extend({
    productionDayId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    supplierId: fields.integerParam.optional(),
    supplierName: fields.name.optional(),
    supplierNumber: fields.number.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const importRules: FilterRule<paginateImportsDTO>[] = [
  { path: ["productionDayId"], param: "productionDayId" },
  { path: ["productionDay", "productionDate"], param: "productionDate" },
  { path: ["supplierId"], param: "supplierId" },
  { path: ["supplier", "name"], param: "supplierName", op: "contains" },
  { path: ["supplier", "number"], param: "supplierNumber", op: "contains" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getImport = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createImport = {
  body: z.strictObject({
    productionDayId: fields.integerBody,
    supplierId: fields.integerBody,
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateImport = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    productionDayId: fields.integerBody.optional(),
    supplierId: fields.integerBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteImport = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateImportsDTO = z.infer<typeof paginateImports.query>;
export type getImportParamsDTO = z.infer<typeof getImport.params>;
export type createImportBodyDTO = z.infer<typeof createImport.body>;
export type updateImportParamsDTO = z.infer<typeof updateImport.params>;
export type updateImportBodyDTO = z.infer<typeof updateImport.body>;
export type deleteImportParamsDTO = z.infer<typeof deleteImport.params>;
