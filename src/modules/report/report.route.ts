import express from "express";
import * as reportController from "./report.controller";
import * as validators from "./report.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";

const router = express.Router();

router.get(
  "/sheet/:id",
  authorization(),
  validation(validators.getSheet),
  reportController.getReportSheet,
);

router.get(
  "/production/variants",
  authorization(),
  validation(validators.getSummary),
  reportController.getVariantsProductionReport,
);
router.get(
  "/production/items",
  authorization(),
  validation(validators.getSummary),
  reportController.getItemsProductionReport,
);

router.get(
  "/consumption/variants",
  authorization(),
  validation(validators.getSummary),
  reportController.getVariantsConsumptionReport,
);
router.get(
  "/consumption/items",
  authorization(),
  validation(validators.getSummary),
  reportController.getItemsConsumptionReport,
);

router.get(
  "/customers",
  authorization(),
  validation(validators.getSummary),
  reportController.getCustomerReport,
);
router.get(
  "/suppliers",
  authorization(),
  validation(validators.getSummary),
  reportController.getSuppliersReport,
);

router.get(
  "/rates",
  authorization(),
  validation(validators.getSummary),
  reportController.getRateReport,
);
router.get(
  "/attendance",
  authorization(),
  validation(validators.getSummary),
  reportController.getAttendanceReport,
);
router.get(
  "/ledger",
  authorization(),
  validation(validators.getSummary),
  reportController.getLedgerReport,
);

export default router;