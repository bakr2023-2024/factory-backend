import express from "express";
import * as supplierReturnController from "./supplierReturn.controller";
import * as validators from "./supplierReturn.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateSupplierReturns), supplierReturnController.getSupplierReturns);
router.get("/:id",validation(validators.getSupplierReturn), supplierReturnController.getSupplierReturn);
router.post("/",validation(validators.createSupplierReturn), supplierReturnController.createSupplierReturn);
router.patch("/:id",validation(validators.updateSupplierReturn), supplierReturnController.updateSupplierReturn);
router.delete("/:id",validation(validators.deleteSupplierReturn), supplierReturnController.deleteSupplierReturn);

export default router;

