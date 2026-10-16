import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateCustomerReturnItems = {
  query: fields.paginate("CustomerReturnItem").extend({
    customerReturnId: fields.integerParam.optional(),
    customerId: fields.integerParam.optional(),
    exportItemId: fields.integerParam.optional(),
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam.optional(),
    quantity: fields.integerParam.optional(),
    minPrice: fields.doubleParam.optional(),
    maxPrice: fields.doubleParam.optional(),
  }),
};
export const getCustomerReturnItem = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createCustomerReturnItem = {
  body: z.strictObject({
    customerReturnId: fields.integerBody,
    exportItemId: fields.integerBody,
    quantity: fields.integerBody,
    unitPrice: fields.doubleBody.optional(),
    notes: z.string().optional(),
  }),
};
export const updateCustomerReturnItem = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    customerReturnId: fields.integerBody.optional(),
    exportItemId: fields.integerBody.optional(),
    quantity: fields.integerBody.optional(),
    unitPrice: fields.doubleBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteCustomerReturnItem = {
  params: z.strictObject({
    id: fields.integerParam,
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
export const customerReturnItemRules: FilterRule<paginateCustomerReturnItemsDTO>[] = [
  { path: ["customerReturnId"], param: "customerReturnId" },
  { path: ["exportItemId"], param: "exportItemId" },
  { path: ["customerReturn", "customerId"], param: "customerId" },
  { path: ["customerReturn", "customer", "name"], param: "customerName", op: "contains" },
  { path: ["customerReturn", "customer", "number"], param: "customerNumber", op: "contains" },
  { path: ["exportItem", "variant", "item", "name"], param: "itemName", op: "contains" },
  { path: ["exportItem", "variant", "unitWeight"], param: "unitWeight" },
  { path: ["quantity"], param: "quantity" },
  { path: ["unitPrice"], param: "minPrice", op: "gte" },
  { path: ["unitPrice"], param: "maxPrice", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];