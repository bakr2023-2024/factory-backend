import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateSupplierReturns = {
  query: fields.paginate("SupplierReturn").extend({
    productionDayId: fields.integerParam().optional(),
    productionDate: fields.date.optional(),
    supplierName: fields.name.optional(),
    supplierNumber: fields.number.optional(),
    supplierId: fields.integerParam().optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const getSupplierReturn = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createSupplierReturn = {
  body: z.strictObject({
    supplierId: fields.integerBody(),
    productionDayId: fields.integerBody(),
    occurredAt: fields.dateTime,
    notes: z.string().optional(),
  }),
};
export const updateSupplierReturn = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    supplierId: fields.integerBody().optional(),
    productionDayId: fields.integerBody().optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSupplierReturn = {
  params: z.strictObject({
    id: fields.integerParam(),
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
