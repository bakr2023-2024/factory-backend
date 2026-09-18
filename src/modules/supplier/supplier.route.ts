import express from "express";
import * as supplierController from "./supplier.controller";
import * as validators from "./supplier.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateSuppliers), supplierController.getSuppliers);
router.get("/:id",validation(validators.getSupplier), supplierController.getSupplier);
router.post("/",validation(validators.createSupplier), supplierController.createSupplier);
router.patch("/:id",validation(validators.updateSupplier), supplierController.updateSupplier);
router.delete("/:id",validation(validators.deleteSupplier), supplierController.deleteSupplier);

export default router;

