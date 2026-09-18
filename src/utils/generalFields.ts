import z from "zod";

const strToNum = (key: string) => {
  return z
    .string()
    .refine((val) => val.trim() && !isNaN(Number(val)) && Number(val) > 0, {
      message: `${key} can only be a positive integer`,
    })
    .transform((val) => Number(val));
};

export const fields = {
  idParam: strToNum("ID"),
  idBody: z.number().min(1, { message: "ID can only be a positive integer" }),
  unitWeight: z
    .number()
    .min(0.1, { message: "unit weight must be above 0" })
    .default(1),
  name: z
    .string()
    .min(3, { message: "Name is too short" })
    .max(100, { message: "Name is too long" }),
  number: z
    .string()
    .min(5, { message: "Number is too short" })
    .max(40, { message: "Number is too long" }),
  paginate: z.strictObject({
    page: strToNum("page").default(1),
    size: strToNum("size").default(20),
    name: z.string().min(3).optional(),
  }),
};
export type paginateDTO = z.infer<typeof fields.paginate>;
