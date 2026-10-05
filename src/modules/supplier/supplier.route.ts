import express from "express";
import * as supplierController from "./supplier.controller";
import * as validators from "./supplier.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateSuppliers),
  supplierController.getSuppliers,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getSupplier),
  supplierController.getSupplier,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createSupplier),
  supplierController.createSupplier,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateSupplier),
  supplierController.updateSupplier,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteSupplier),
  supplierController.deleteSupplier,
);

export default router;

