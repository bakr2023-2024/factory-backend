import z from "zod";
import { fields } from "../../utils/generalFields";
import { StockMovementType } from "../../db/generated/prisma/enums";
import { FilterRule } from "../../utils/utils";

export const paginateStockMovements = {
  query: fields
    .paginate("StockMovement")
    .extend({
      variantId: fields.integerParam.optional(),
      unitWeight: fields.doubleParam.optional(),
      occurredFrom: fields.dateTime.optional(),
      occurredTo: fields.dateTime.optional(),
      itemName: fields.name.optional(),
      type: z.enum(Object.values(StockMovementType)).optional(),
      typeRef: fields.integerParam.optional(),
      quantityChanged: fields.integerParam.optional(),
    })
    .refine((data) => !data.typeRef || (data.typeRef && data.type), {
      message: "A type is needed for typeRef to reference",
      path: ["typeRef"],
    }),
};
export const stockMovementRules: FilterRule<paginateStockMovementsDTO>[] = [
  { path: ["variantId"], param: "variantId" },
  { path: ["variant", "unitWeight"], param: "unitWeight" },
  { path: ["variant", "item", "name"], param: "itemName", op: "contains" },
  { path: ["type"], param: "type" },
  { path: ["typeRef"], param: "typeRef" },
  { path: ["quantityChanged"], param: "quantityChanged" },
  { path: ["occurredAt"], param: "occurredFrom", op: "gte" },
  { path: ["occurredAt"], param: "occurredTo", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getStockMovement = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export type paginateStockMovementsDTO = z.infer<
  typeof paginateStockMovements.query
>;
export type getStockMovementParamsDTO = z.infer<typeof getStockMovement.params>;
