import express from "express";
import * as exportItemController from "./exportItem.controller";
import * as validators from "./exportItem.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateExportItems),
  exportItemController.getExportItems,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getExportItem),
  exportItemController.getExportItem,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createExportItem),
  exportItemController.createExportItem,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateExportItem),
  exportItemController.updateExportItem,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteExportItem),
  exportItemController.deleteExportItem,
);

export default router;

