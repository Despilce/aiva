import express from "express";
import {
  createTestIssues,
  updateIssueStatus,
} from "../controllers/issue.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create test issues (for development/testing)
router.post("/createTestIssues", verifyAuth, createTestIssues);

// Update issue status
router.put("/:issueId/status", verifyAuth, updateIssueStatus);

export default router;
