import express from "express";
import * as variantController from "./variant.controller";
import * as validators from "./variant.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateVariants),
  variantController.getVariants,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getVariant),
  variantController.getVariant,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createVariant),
  variantController.createVariant,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateVariant),
  variantController.updateVariant,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteVariant),
  variantController.deleteVariant,
);

export default router;

