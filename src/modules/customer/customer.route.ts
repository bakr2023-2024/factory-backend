import express from "express";
import * as customerController from "./customer.controller";
import * as validators from "./customer.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get(
  "/",
  validation(validators.paginateCustomers),
  customerController.getCustomers,
);
router.get(
  "/:id",
  validation(validators.getCustomer),
  customerController.getCustomer,
);
router.post(
  "/",
  validation(validators.createCustomer),
  customerController.createCustomer,
);
router.patch(
  "/:id",
  validation(validators.updateCustomer),
  customerController.updateCustomer,
);
router.delete(
  "/:id",
  validation(validators.deleteCustomer),
  customerController.deleteCustomer,
);

export default router;
