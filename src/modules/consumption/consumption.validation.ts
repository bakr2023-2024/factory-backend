import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateConsumptions = {
  query: fields.paginate("Consumption").extend({
    productionDayId: fields.idParam.optional(),
    variantId: fields.idParam.optional(),
    productionDate: fields.date.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.unitWeightParam.optional(),
    quantity: fields.quantityParam.optional(),
  }),
};
export const getConsumption = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createConsumption = {
  body: z.strictObject({
    productionDayId: fields.idBody,
    variantId: fields.idBody,
    occurredAt: fields.dateTime,
    quantity: fields.quantity,
    notes: z.string().optional(),
  }),
};
export const updateConsumption = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    productionDayId: fields.idBody.optional(),
    variantId: fields.idBody.optional(),
    occurredAt: fields.dateTime.optional(),
    quantity: fields.quantity.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteConsumption = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateConsumptionsDTO = z.infer<
  typeof paginateConsumptions.query
>;
export type getConsumptionParamsDTO = z.infer<typeof getConsumption.params>;
export type createConsumptionBodyDTO = z.infer<typeof createConsumption.body>;
export type updateConsumptionParamsDTO = z.infer<
  typeof updateConsumption.params
>;
export type updateConsumptionBodyDTO = z.infer<typeof updateConsumption.body>;
export type deleteConsumptionParamsDTO = z.infer<
  typeof deleteConsumption.params
>;
