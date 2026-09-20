import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateCustomers = {
  query: fields.paginate("Customer").extend({
    name: fields.name.optional(),
    number: fields.number.optional(),
  }),
};
export const getCustomer = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createCustomer = {
  body: z.strictObject({
    name: fields.name,
    number: fields.number.optional(),
    notes: z.string().optional(),
  }),
};
export const updateCustomer = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    name: fields.name.optional(),
    number: fields.number.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteCustomer = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateCustomersDTO = z.infer<typeof paginateCustomers.query>;
export type getCustomerParamsDTO = z.infer<typeof getCustomer.params>;
export type createCustomerBodyDTO = z.infer<typeof createCustomer.body>;
export type updateCustomerParamsDTO = z.infer<typeof updateCustomer.params>;
export type updateCustomerBodyDTO = z.infer<typeof updateCustomer.body>;
export type deleteCustomerParamsDTO = z.infer<typeof deleteCustomer.params>;
