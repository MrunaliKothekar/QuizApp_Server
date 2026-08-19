import express from "express";
import { createQuiz ,
     getAllQuizzes,
     getQuizById,
     getPublishedQuizzes,
     updateQuiz,
     deleteQuiz,
     addQuestions,
     getQuestions,
     updateQuestion,
    deleteQuestion,
    toggleQuizPublish,
} from "../controllers/quizController.js";
import {
  protect,
  adminOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createQuiz);
router.get("/", protect, getAllQuizzes);
router.get("/:id", protect, getQuizById);
router.put("/:id", protect, adminOnly, updateQuiz);
router.delete("/:id", protect, adminOnly, deleteQuiz);
router.post("/:quizId/questions", protect, adminOnly, addQuestions);
router.get("/:quizId/questions", protect, getQuestions);
router.put(
  "/:quizId/questions/:questionIndex",
  protect,
  adminOnly,
  updateQuestion
);
router.delete(
  "/:quizId/questions/:questionIndex",
  protect,
  adminOnly,
  deleteQuestion
);
router.patch(
  "/:id/publish",
  protect,
  adminOnly,
  toggleQuizPublish
);
router.get(
  "/published",
  protect,
  getPublishedQuizzes
);
export default router;