import express from "express";
import * as productionBatchController from "./productionBatch.controller";
import * as validators from "./productionBatch.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get(
  "/",
  validation(validators.paginateProductionBatches),
  productionBatchController.getProductionBatches,
);
router.get(
  "/:id",
  validation(validators.getProductionBatch),
  productionBatchController.getProductionBatch,
);
router.post(
  "/",
  validation(validators.createProductionBatch),
  productionBatchController.createProductionBatch,
);
router.patch(
  "/:id",
  validation(validators.updateProductionBatch),
  productionBatchController.updateProductionBatch,
);
router.delete(
  "/:id",
  validation(validators.deleteProductionBatch),
  productionBatchController.deleteProductionBatch,
);

export default router;
