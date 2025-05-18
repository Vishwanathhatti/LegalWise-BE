import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    user:{
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title:{
        type: String,
        required: true,
    },
    messages:[
        {
            type: mongoose.Types.ObjectId,
            ref:'Message',
            required:true
        }
    ],

},{timestamps:true})

const conversationModel = mongoose.model('Conversation',conversationSchema)

export default conversationModel;