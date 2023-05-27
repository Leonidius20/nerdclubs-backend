import { Router } from "express";
import controller from "../controllers/comment.votes.controller.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";

const router = Router();

router.post("/", authenticateJWT, controller.voteForComment);
router.get("/:comment_id", controller.getVotesForComment);
router.get("/:comment_id/my", authenticateJWT, controller.getMyVoteForComment);

export default router;