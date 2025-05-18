import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    text: { type: String, required: true },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    ],
},
    { timestamps: true }
)

const commentModel = mongoose.model('Comment', commentSchema)
export default commentModel;