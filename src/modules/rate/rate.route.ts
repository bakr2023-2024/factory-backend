import express from "express";
import * as rateController from "./rate.controller";
import * as validators from "./rate.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get("/",authorization(),validation(validators.paginateRates), rateController.getRates);
router.get("/:id",authorization(),validation(validators.getRate), rateController.getRate);
router.post("/",authorization(["ADMIN"]),validation(validators.createRate), rateController.createRate);
router.patch("/:id",authorization(["ADMIN"]),validation(validators.updateRate), rateController.updateRate);
router.delete("/:id",authorization(["ADMIN"]),validation(validators.deleteRate), rateController.deleteRate);

export default router;

