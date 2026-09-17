import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import authRouter from "./modules/auth/auth.route";
import itemRouter from "./modules/item/item.route";
import { HttpException } from "./utils/exceptions";
import prisma from "./db/prisma";
const app = express();
app.use(express.json());
app.use("/auth", authRouter);
app.use("/items", itemRouter);
app.get("/", (req: Request, res: Response) =>
  res.json({ message: "Welcome to factory backend" }),
);
app.use(
  (err: HttpException, req: Request, res: Response, next: NextFunction) => {
    const json: { message: string; stack?: string; cause?: unknown } = {
      message: err.message || "Internal Server Error",
    };
    if (process.env["MODE"] == "DEV") json["stack"] = err.stack;
    if (err.cause) json["cause"] = err.cause;
    return res.status(err.statusCode || 500).json(json);
  },
);

export default app;
