import express from "express";
import * as loanPaymentController from "./loanPayment.controller";
import * as validators from "./loanPayment.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get("/",authorization(),validation(validators.paginateLoanPayments), loanPaymentController.getLoanPayments);
router.get("/:id",authorization(),validation(validators.getLoanPayment), loanPaymentController.getLoanPayment);
router.post("/",authorization(["ADMIN"]),validation(validators.createLoanPayment), loanPaymentController.createLoanPayment);
router.patch("/:id",authorization(["ADMIN"]),validation(validators.updateLoanPayment), loanPaymentController.updateLoanPayment);
router.delete("/:id",authorization(["ADMIN"]),validation(validators.deleteLoanPayment), loanPaymentController.deleteLoanPayment);

export default router;

