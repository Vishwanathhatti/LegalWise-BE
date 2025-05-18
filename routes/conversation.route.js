import express from "express";
import { createConversation, getCurrentConversation, getUserConversations } from "../controllers/conversation.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const conversationRouter = express.Router()

conversationRouter.route('/create').post(verifyToken,createConversation)
conversationRouter.route('/get').get(verifyToken,getUserConversations)
conversationRouter.route('/get/:id').get(verifyToken,getCurrentConversation)
export default conversationRouter;