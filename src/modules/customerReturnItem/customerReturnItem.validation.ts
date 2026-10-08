import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateCustomerReturnItems = {
  query: fields.paginate("CustomerReturnItem").extend({
    customerReturnId: fields.idParam.optional(),
    customerId: fields.idParam.optional(),
    exportItemId: fields.idParam.optional(),
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.unitWeightParam.optional(),
    quantity: fields.quantityParam.optional(),
    minPrice: fields.unitPriceParam.optional(),
    maxPrice: fields.unitPriceParam.optional(),
  }),
};
export const getCustomerReturnItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createCustomerReturnItem = {
  body: z.strictObject({
    customerReturnId: fields.idBody,
    exportItemId: fields.idBody,
    quantity: fields.quantity,
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const updateCustomerReturnItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    customerReturnId: fields.idBody.optional(),
    exportItemId: fields.idBody.optional(),
    quantity: fields.quantity.optional(),
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteCustomerReturnItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateCustomerReturnItemsDTO = z.infer<
  typeof paginateCustomerReturnItems.query
>;
export type getCustomerReturnItemParamsDTO = z.infer<
  typeof getCustomerReturnItem.params
>;
export type createCustomerReturnItemBodyDTO = z.infer<
  typeof createCustomerReturnItem.body
>;
export type updateCustomerReturnItemParamsDTO = z.infer<
  typeof updateCustomerReturnItem.params
>;
export type updateCustomerReturnItemBodyDTO = z.infer<
  typeof updateCustomerReturnItem.body
>;
export type deleteCustomerReturnItemParamsDTO = z.infer<
  typeof deleteCustomerReturnItem.params
>;
