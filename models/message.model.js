import mongoose from "mongoose";

const MessageSchema = mongoose.Schema({
    role: { 
        type: String, 
        enum: ["user", "bot"], 
        required: true 
      },
      content: { 
        type: String, 
        required: true 
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      }
    });

const MessageModel= mongoose.model('Message', MessageSchema);
export default MessageModel;