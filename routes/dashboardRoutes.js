import express from "express";

import {
  getAdminDashboard,
} from "../controllers/dashboardController.js";

import {
  protect,
  adminOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/admin",
  protect,
  adminOnly,
  getAdminDashboard
);

export default router;