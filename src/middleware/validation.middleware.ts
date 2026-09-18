import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { BadRequestException } from "../utils/exceptions";
import { ErrorDetail } from "../utils/types/types";
type ReqKey = "body" | "params" | "query";
type Schema = Partial<Record<ReqKey, ZodType>>;
const validation = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: ErrorDetail[] = [];
    for (const key of Object.keys(schema) as ReqKey[]) {
      if (!schema[key] || !req[key]) continue;
      const result = schema[key].safeParse(req[key]);
      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            key,
            message: issue.message,
            path: issue.path,
          })),
        );
      } else {
        if (key == "query")
          Object.defineProperty(req, "query", {
            ...Object.getOwnPropertyDescriptor(req, "query"),
            value: req.query,
            writable: true,
          });
        req[key] = result.data;
      }
    }
    if (errors.length)
      throw new BadRequestException("Validation Error", errors);
    next();
  };
};
export default validation;
