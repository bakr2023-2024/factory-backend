import express from "express";
import * as importController from "./import.controller";
import * as validators from "./import.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateImports),
  importController.getImports,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getImport),
  importController.getImport,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createImport),
  importController.createImport,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateImport),
  importController.updateImport,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteImport),
  importController.deleteImport,
);

export default router;

