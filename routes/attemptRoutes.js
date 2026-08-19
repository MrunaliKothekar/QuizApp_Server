import express from "express";
import { startAttempt,
        submitAttempt,
        getMyAttempts,
        getAttemptById,
        getAllAttempts,
        getAdminAttemptById,
        getLeaderboard,
 } from "../controllers/attemptController.js";
import { protect,adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:quizId", protect, startAttempt);

router.get("/leaderboard",protect,getLeaderboard);
router.post("/:attemptId/submit", protect, submitAttempt);
router.get("/my", protect, getMyAttempts);
router.get("/:attemptId", protect, getAttemptById);
router.get("/", protect, adminOnly, getAllAttempts);
router.get("/admin/:attemptId",protect,adminOnly,getAdminAttemptById);



export default router;