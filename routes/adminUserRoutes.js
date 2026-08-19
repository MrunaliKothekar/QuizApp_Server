import express from "express";

import {
  getAllStudents,
  getStudentById,
  updateStudentStatus,
  deleteStudent,
} from "../controllers/adminUserController.js";

import {
  protect,
  adminOnly,
} from "../middlewares/authMiddleware.js";

const router = express.Router();


// All routes below require ADMIN authentication
router.use(protect, adminOnly);


// GET /api/admin/users
router.get("/", getAllStudents);


// GET /api/admin/users/:id
router.get("/:id", getStudentById);


// PATCH /api/admin/users/:id/status
router.patch("/:id/status", updateStudentStatus);


// DELETE /api/admin/users/:id
router.delete("/:id", deleteStudent);


export default router;