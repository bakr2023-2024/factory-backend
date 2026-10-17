import express from "express";
import * as expenseController from "./expense.controller";
import * as validators from "./expense.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get("/",authorization(),validation(validators.paginateExpenses), expenseController.getExpenses);
router.get("/:id",authorization(),validation(validators.getExpense), expenseController.getExpense);
router.post("/",authorization(["ADMIN"]),validation(validators.createExpense), expenseController.createExpense);
router.patch("/:id",authorization(["ADMIN"]),validation(validators.updateExpense), expenseController.updateExpense);
router.delete("/:id",authorization(["ADMIN"]),validation(validators.deleteExpense), expenseController.deleteExpense);

export default router;

