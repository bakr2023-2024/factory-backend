import express from "express";
import * as customerReturnController from "./customerReturn.controller";
import * as validators from "./customerReturn.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateCustomerReturns), customerReturnController.getCustomerReturns);
router.get("/:id",validation(validators.getCustomerReturn), customerReturnController.getCustomerReturn);
router.post("/",validation(validators.createCustomerReturn), customerReturnController.createCustomerReturn);
router.patch("/:id",validation(validators.updateCustomerReturn), customerReturnController.updateCustomerReturn);
router.delete("/:id",validation(validators.deleteCustomerReturn), customerReturnController.deleteCustomerReturn);

export default router;

