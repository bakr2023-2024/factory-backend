import express from "express";
import * as loanController from "./loan.controller";
import * as validators from "./loan.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get("/",authorization(),validation(validators.paginateLoans), loanController.getLoans);
router.get("/:id",authorization(),validation(validators.getLoan), loanController.getLoan);
router.post("/",authorization(["ADMIN"]),validation(validators.createLoan), loanController.createLoan);
router.patch("/:id",authorization(["ADMIN"]),validation(validators.updateLoan), loanController.updateLoan);
router.delete("/:id",authorization(["ADMIN"]),validation(validators.deleteLoan), loanController.deleteLoan);

export default router;

