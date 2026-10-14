import express from "express";
import * as attendanceController from "./attendance.controller";
import * as validators from "./attendance.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get("/",authorization(),validation(validators.paginateAttendances), attendanceController.getAttendances);
router.get("/:id",authorization(),validation(validators.getAttendance), attendanceController.getAttendance);
router.post("/",authorization(["ADMIN"]),validation(validators.createAttendance), attendanceController.createAttendance);
router.patch("/:id",authorization(["ADMIN"]),validation(validators.updateAttendance), attendanceController.updateAttendance);
router.delete("/:id",authorization(["ADMIN"]),validation(validators.deleteAttendance), attendanceController.deleteAttendance);

export default router;

