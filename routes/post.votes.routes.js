import { Router } from "express";
import controller from "../controllers/post.votes.controller.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";

const router = Router();

router.post("/", authenticateJWT, controller.voteForPost);
router.get("/:post_id", controller.getVotesForPost);
router.get("/:post_id/my", authenticateJWT, controller.getMyVoteForPost);

export default router;