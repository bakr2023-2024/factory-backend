import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateSupplierReturnItems = {
  query: fields.paginate("SupplierReturnItem").extend({
    supplierReturnId: fields.integerParam().optional(),
    supplierId: fields.integerParam().optional(),
    importItemId: fields.integerParam().optional(),
    supplierName: fields.name.optional(),
    supplierNumber: fields.number.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam().optional(),
    quantity: fields.integerParam().optional(),
    minPrice: fields.doubleParam().optional(),
    maxPrice: fields.doubleParam().optional(),
  }),
};
export const getSupplierReturnItem = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createSupplierReturnItem = {
  body: z.strictObject({
    supplierReturnId: fields.integerBody(),
    importItemId: fields.integerBody(),
    quantity: fields.integerBody(),
    unitPrice: fields.doubleBody().optional(),
    notes: z.string().optional(),
  }),
};
export const updateSupplierReturnItem = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    supplierReturnId: fields.integerBody().optional(),
    importItemId: fields.integerBody().optional(),
    quantity: fields.integerBody().optional(),
    unitPrice: fields.doubleBody().optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSupplierReturnItem = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateSupplierReturnItemsDTO = z.infer<
  typeof paginateSupplierReturnItems.query
>;
export type getSupplierReturnItemParamsDTO = z.infer<
  typeof getSupplierReturnItem.params
>;
export type createSupplierReturnItemBodyDTO = z.infer<
  typeof createSupplierReturnItem.body
>;
export type updateSupplierReturnItemParamsDTO = z.infer<
  typeof updateSupplierReturnItem.params
>;
export type updateSupplierReturnItemBodyDTO = z.infer<
  typeof updateSupplierReturnItem.body
>;
export type deleteSupplierReturnItemParamsDTO = z.infer<
  typeof deleteSupplierReturnItem.params
>;
