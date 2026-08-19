import express from "express";

import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  deactivateMyAccount,
} from "../controllers/userController.js";

import {
  protect,
  studentOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
   Student profile
*/

router.get(
  "/profile",
  protect,
  studentOnly,
  getMyProfile
);

router.put(
  "/profile",
  protect,
  studentOnly,
  updateMyProfile
);

/*
   Security
*/

router.put(
  "/change-password",
  protect,
  studentOnly,
  changePassword
);

/*
   Account deactivation
*/

router.put(
  "/deactivate",
  protect,
  studentOnly,
  deactivateMyAccount
);

export default router;