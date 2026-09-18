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
  id: strToNum("ID"),
  name: z.string().min(3).max(100),
  paginate: z.strictObject({
    page: strToNum("page").default(1),
    size: strToNum("size").default(20),
    name: z.string().min(3).optional(),
  }),
};
export type paginateDTO = z.infer<typeof fields.paginate>;
