import express from "express";
import * as exportController from "./export.controller";
import * as validators from "./export.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateExports),
  exportController.getExports,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getExport),
  exportController.getExport,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createExport),
  exportController.createExport,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateExport),
  exportController.updateExport,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteExport),
  exportController.deleteExport,
);

export default router;

