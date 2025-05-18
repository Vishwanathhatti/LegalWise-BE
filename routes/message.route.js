import express from "express"
import { verifyToken } from "../middlewares/verifyToken.js"
import { addMessage } from "../controllers/message.controller.js"

const messageRouter = express.Router()

messageRouter.route('/:id').post(verifyToken, addMessage)

export default messageRouter;