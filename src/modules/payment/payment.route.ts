import express from "express";
import * as paymentController from "./payment.controller";
import * as validators from "./payment.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get("/",authorization(),validation(validators.paginatePayments), paymentController.getPayments);
router.get("/preview/:id",authorization(),validation(validators.getPayment),paymentController.getPreview)
router.get("/:id",authorization(),validation(validators.getPayment), paymentController.getPayment);
router.post("/",authorization(["ADMIN"]),validation(validators.createPayment), paymentController.createPayment);
router.delete("/:id",authorization(["ADMIN"]),validation(validators.deletePayment), paymentController.deletePayment);

export default router;

