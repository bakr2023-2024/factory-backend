import express from "express";
import * as weekController from "./week.controller";
import * as validators from "./week.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateWeeks),
  weekController.getWeeks,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getWeek),
  weekController.getWeek,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createWeek),
  weekController.createWeek,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateWeek),
  weekController.updateWeek,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteWeek),
  weekController.deleteWeek,
);

export default router;

