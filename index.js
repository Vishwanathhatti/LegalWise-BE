import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import connectDB from "./utils/db.js";
import "dotenv/config";
import userRouter from "./routes/user.route.js";
import conversationRouter from "./routes/conversation.route.js";
import messageRouter from "./routes/message.route.js";
import postRouter from "./routes/post.route.js";
import commentRouter from "./routes/comment.route.js";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const corsOption={
    origin:'http://localhost:5173',
    credentials:true,
}
app.use(cors(corsOption));


app.use('/api/user',userRouter)
app.use('/api/conversation',conversationRouter)
app.use('/api/conversation', messageRouter)
// commmunity
app.use('/api/community/post', postRouter);
app.use('/api/community/comments', commentRouter ) // Comments from community posts

const Port = process.env.PORT || 5000;

app.listen(Port, async () => {
    await connectDB();
    console.log("Server is running on Port:", Port);
});
