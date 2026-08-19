import express from "express";

import {
  uploadImage,
} from "../controllers/uploadController.js";

import {
  protect,
  adminOnly,
} from "../middlewares/authMiddleware.js";

import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/image",
  protect,
  adminOnly,
  upload.single("image"),
  uploadImage
);

export default router;