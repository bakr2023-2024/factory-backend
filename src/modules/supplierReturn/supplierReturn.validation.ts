import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateSupplierReturns = {
  query: fields.paginate("SupplierReturn").extend({
    productionDayId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    supplierName: fields.name.optional(),
    supplierNumber: fields.number.optional(),
    supplierId: fields.integerParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const supplierReturnRules: FilterRule<paginateSupplierReturnsDTO>[] = [
  { path: ["productionDayId"], param: "productionDayId" },
  { path: ["productionDay", "productionDate"], param: "productionDate" },
  { path: ["supplier", "name"], param: "supplierName", op: "contains" },
  { path: ["supplier", "number"], param: "supplierNumber", op: "contains" },
  { path: ["supplierId"], param: "supplierId" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getSupplierReturn = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createSupplierReturn = {
  body: z.strictObject({
    supplierId: fields.integerBody,
    productionDayId: fields.integerBody,
    occurredAt: fields.dateTime,
    notes: z.string().optional(),
  }),
};
export const updateSupplierReturn = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    supplierId: fields.integerBody.optional(),
    productionDayId: fields.integerBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSupplierReturn = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateSupplierReturnsDTO = z.infer<
  typeof paginateSupplierReturns.query
>;
export type getSupplierReturnParamsDTO = z.infer<
  typeof getSupplierReturn.params
>;
export type createSupplierReturnBodyDTO = z.infer<
  typeof createSupplierReturn.body
>;
export type updateSupplierReturnParamsDTO = z.infer<
  typeof updateSupplierReturn.params
>;
export type updateSupplierReturnBodyDTO = z.infer<
  typeof updateSupplierReturn.body
>;
export type deleteSupplierReturnParamsDTO = z.infer<
  typeof deleteSupplierReturn.params
>;
