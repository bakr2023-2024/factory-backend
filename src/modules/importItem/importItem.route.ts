import express from "express";
import * as importItemController from "./importItem.controller";
import * as validators from "./importItem.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get(
  "/",
  validation(validators.paginateImportItems),
  importItemController.getImportItems,
);
router.get(
  "/:id",
  validation(validators.getImportItem),
  importItemController.getImportItem,
);
router.post(
  "/",
  validation(validators.createImportItem),
  importItemController.createImportItem,
);
router.patch(
  "/:id",
  validation(validators.updateImportItem),
  importItemController.updateImportItem,
);
router.delete(
  "/:id",
  validation(validators.deleteImportItem),
  importItemController.deleteImportItem,
);

export default router;
