import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateCustomerReturns = {
  query: fields.paginate("CustomerReturn").extend({
    productionDayId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    customerId: fields.integerParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const getCustomerReturn = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createCustomerReturn = {
  body: z.strictObject({
    customerId: fields.integerBody,
    productionDayId: fields.integerBody,
    occurredAt: fields.dateTime,
    notes: z.string().optional(),
  }),
};
export const updateCustomerReturn = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    customerId: fields.integerBody.optional(),
    productionDayId: fields.integerBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteCustomerReturn = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateCustomerReturnsDTO = z.infer<
  typeof paginateCustomerReturns.query
>;
export type getCustomerReturnParamsDTO = z.infer<
  typeof getCustomerReturn.params
>;
export type createCustomerReturnBodyDTO = z.infer<
  typeof createCustomerReturn.body
>;
export type updateCustomerReturnParamsDTO = z.infer<
  typeof updateCustomerReturn.params
>;
export type updateCustomerReturnBodyDTO = z.infer<
  typeof updateCustomerReturn.body
>;
export type deleteCustomerReturnParamsDTO = z.infer<
  typeof deleteCustomerReturn.params
>;
export const customerReturnRules: FilterRule<paginateCustomerReturnsDTO>[] = [
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