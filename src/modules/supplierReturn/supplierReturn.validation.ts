import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateSupplierReturns = {
  query: fields.paginate("SupplierReturn").extend({
    supplierName: fields.name.optional(),
    supplierNumber: fields.number.optional(),
    supplierId: fields.idParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const getSupplierReturn = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createSupplierReturn = {
  body: z.strictObject({
    supplierId: fields.idBody,
    occurredAt: fields.dateTime,
    notes: z.string().optional(),
  }),
};
export const updateSupplierReturn = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    supplierId: fields.idBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSupplierReturn = {
  params: z.strictObject({
    id: fields.idParam,
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
