import express from "express";
import { forgotPassword, login, logout, registerUser, resetPassword } from "../controllers/user.controller.js";
import multer from "multer";
import { verifyToken } from "../middlewares/verifyToken.js";

const userRouter = express.Router()

const upload = multer()
userRouter.route('/register').post(registerUser)
userRouter.route('/login').post(login)
userRouter.route('/logout').get(verifyToken,logout)
userRouter.route('/forgot-password').post(forgotPassword)
userRouter.route('/reset-password/:token').post(resetPassword)

export default userRouter;