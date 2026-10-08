import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateSupplierReturnItems = {
  query: fields.paginate("SupplierReturnItem").extend({
    supplierReturnId: fields.idParam.optional(),
    supplierId: fields.idParam.optional(),
    importItemId: fields.idParam.optional(),
    supplierName: fields.name.optional(),
    supplierNumber: fields.number.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.unitWeightParam.optional(),
    quantity: fields.quantityParam.optional(),
    minPrice: fields.unitPriceParam.optional(),
    maxPrice: fields.unitPriceParam.optional(),
  }),
};
export const getSupplierReturnItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createSupplierReturnItem = {
  body: z.strictObject({
    supplierReturnId: fields.idBody,
    importItemId: fields.idBody,
    quantity: fields.quantity,
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const updateSupplierReturnItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    supplierReturnId: fields.idBody.optional(),
    importItemId: fields.idBody.optional(),
    quantity: fields.quantity.optional(),
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSupplierReturnItem = {
  params: z.strictObject({
    id: fields.idParam,
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
