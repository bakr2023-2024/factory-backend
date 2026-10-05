import express from "express";
import * as seasonController from "./season.controller";
import * as validators from "./season.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateSeasons),
  seasonController.getSeasons,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getSeason),
  seasonController.getSeason,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createSeason),
  seasonController.createSeason,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateSeason),
  seasonController.updateSeason,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteSeason),
  seasonController.deleteSeason,
);

export default router;

