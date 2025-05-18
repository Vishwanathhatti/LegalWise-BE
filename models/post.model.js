import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        }
    ]
},
    { timestamps: true }
)

const postModel = mongoose.model('Post', postSchema)
export default postModel;