import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { HttpException } from "./utils/exceptions";
import authRouter from "./modules/auth/auth.route";
import itemRouter from "./modules/item/item.route";
import variantRouter from "./modules/variant/variant.route";
import supplierRouter from "./modules/supplier/supplier.route";
import customerRouter from "./modules/customer/customer.route";
import importRouter from "./modules/import/import.route";
import exportRouter from "./modules/export/export.route";
import importItemRouter from "./modules/importItem/importItem.route";
import exportItemRouter from "./modules/exportItem/exportItem.route";
import seasonRouter from "./modules/season/season.route";
import weekRouter from "./modules/week/week.route";
import productionDayRouter from "./modules/productionDay/productionDay.route";
import { ErrorDetail } from "./utils/types/types";
import { authentication } from "./middleware/auth.middleware";
const app = express();
app.use(express.json());
app.use("/auth", authRouter);
app.use("/items", authentication, itemRouter);
app.use("/variants", authentication, variantRouter);
app.use("/suppliers", authentication, supplierRouter);
app.use("/customers", authentication, customerRouter);
app.use("/imports", authentication, importRouter);
app.use("/exports", authentication, exportRouter);
app.use("/importItems", authentication, importItemRouter);
app.use("/exportItems", authentication, exportItemRouter);
app.use("/seasons", authentication, seasonRouter);
app.use("/weeks", authentication, weekRouter);
app.use("/productionDays", authentication, productionDayRouter);
app.get("/", (req: Request, res: Response) =>
  res.json({ message: "Welcome to factory backend" }),
);
app.use(
  (err: HttpException, req: Request, res: Response, next: NextFunction) => {
    const json: { message: string; stack?: string; cause?: ErrorDetail[] } = {
      message: err.message || "Internal Server Error",
    };
    if (process.env["MODE"] == "DEV") json.stack = err.stack;
    if (err.cause) json.cause = err.cause;
    return res.status(err.statusCode || 500).json(json);
  },
);

export default app;
