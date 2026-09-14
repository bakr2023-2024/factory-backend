import express from "express";
import * as authController from "./auth.controller";
import * as validators from "./auth.validation";
import validation from "../../middleware/validation.middleware";
const router = express.Router();

router.post("/signup", validation(validators.signup), authController.signup);
router.post("/login", validation(validators.login), authController.login);

export default router;
