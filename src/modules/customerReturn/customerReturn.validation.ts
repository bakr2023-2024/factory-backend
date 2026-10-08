import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateCustomerReturns = {
  query: fields.paginate("CustomerReturn").extend({
    customerName: fields.name.optional(),
    customerNumber: fields.number.optional(),
    customerId: fields.idParam.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
  }),
};
export const getCustomerReturn = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createCustomerReturn = {
  body: z.strictObject({
    customerId: fields.idBody,
    occurredAt: fields.dateTime,
    notes: z.string().optional(),
  }),
};
export const updateCustomerReturn = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    customerId: fields.idBody.optional(),
    occurredAt: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteCustomerReturn = {
  params: z.strictObject({
    id: fields.idParam,
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
