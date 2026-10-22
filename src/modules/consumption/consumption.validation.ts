import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateConsumptions = {
  query: fields.paginate("Consumption").extend({
    productionDayId: fields.integerParam.optional(),
    variantId: fields.integerParam.optional(),
    productionDate: fields.date.optional(),
    occurredFrom: fields.dateTime.optional(),
    occurredTo: fields.dateTime.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam.optional(),
    quantity: fields.integerParam.optional(),
  }),
};
export const getConsumption = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createConsumption = {
  body: z.strictObject({
    productionDayId: fields.integerBody,
    variantId: fields.integerBody,
    occurredAt: fields.dateTime.optional(),
    quantity: fields.integerBody,
    notes: z.string().optional(),
  }),
};
export const updateConsumption = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    productionDayId: fields.integerBody.optional(),
    variantId: fields.integerBody.optional(),
    occurredAt: fields.dateTime.optional(),
    quantity: fields.integerBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteConsumption = {
  params: z.strictObject({
    id: fields.integerParam,
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
export const consumptionRules: FilterRule<paginateConsumptionsDTO>[] = [
  { path: ["productionDayId"], param: "productionDayId" },
  { path: ["variantId"], param: "variantId" },
  { path: ["productionDay", "productionDate"], param: "productionDate" },
  { path: ["variant", "item", "name"], param: "itemName", op: "contains" },
  { path: ["variant", "unitWeight"], param: "unitWeight" },
  { path: ["quantity"], param: "quantity" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];