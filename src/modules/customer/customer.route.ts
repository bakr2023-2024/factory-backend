import express from "express";
import * as customerController from "./customer.controller";
import * as validators from "./customer.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateCustomers),
  customerController.getCustomers,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getCustomer),
  customerController.getCustomer,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createCustomer),
  customerController.createCustomer,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateCustomer),
  customerController.updateCustomer,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteCustomer),
  customerController.deleteCustomer,
);

export default router;
