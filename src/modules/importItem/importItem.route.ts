import express from "express";
import * as importItemController from "./importItem.controller";
import * as validators from "./importItem.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateImportItems),
  importItemController.getImportItems,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getImportItem),
  importItemController.getImportItem,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createImportItem),
  importItemController.createImportItem,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateImportItem),
  importItemController.updateImportItem,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteImportItem),
  importItemController.deleteImportItem,
);

export default router;
