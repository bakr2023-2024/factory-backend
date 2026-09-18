import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateSuppliers = {
  query: fields.paginate.extend({
    name: fields.name.optional(),
    number: fields.number.optional(),
  }),
};
export const getSupplier = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createSupplier = {
  body: z.strictObject({
    name: fields.name,
    number: fields.number.optional(),
    notes: z.string().optional(),
  }),
};
export const updateSupplier = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    name: fields.name.optional(),
    number: fields.number.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSupplier = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateSuppliersDTO = z.infer<typeof paginateSuppliers.query>;
export type getSupplierParamsDTO = z.infer<typeof getSupplier.params>;
export type createSupplierBodyDTO = z.infer<typeof createSupplier.body>;
export type updateSupplierParamsDTO = z.infer<typeof updateSupplier.params>;
export type updateSupplierBodyDTO = z.infer<typeof updateSupplier.body>;
export type deleteSupplierParamsDTO = z.infer<typeof deleteSupplier.params>;
