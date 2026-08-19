import express from "express";

import {
  getReportOverview,
  getQuizPerformance,
  getRecentAttempts,
} from "../controllers/reportController.js";

import {
  protect,
  adminOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();


// Report overview
router.get(
  "/overview",
  protect,
  adminOnly,
  getReportOverview
);


// Quiz performance
router.get(
  "/quiz-performance",
  protect,
  adminOnly,
  getQuizPerformance
);


// Recent attempts
router.get(
  "/recent-attempts",
  protect,
  adminOnly,
  getRecentAttempts
);


export default router;