import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { BadRequestException } from "../utils/exceptions";
type ReqKey = "body" | "params" | "query";
type Schema = Partial<Record<ReqKey, ZodType>>;
const validation = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: {
      key: ReqKey;
      issues: { message: string; path: PropertyKey | undefined }[];
    }[] = [];
    for (const key of Object.keys(schema) as ReqKey[]) {
      if (!schema[key] || !req[key]) continue;
      const result = schema[key].safeParse(req[key]);
      if (!result.success) {
        errors.push({
          key,
          issues: result.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path[0],
          })),
        });
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
      throw new BadRequestException("Validation Error", { errors });
    next();
  };
};
export default validation;
