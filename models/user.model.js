import mongoose, { Types } from "mongoose";

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required:true,
    },
    phoneNumber:{
        type:Number,
        required:true,
    },
    password:{
        type:String,
        required: true
    },
    lastLogin:{
        type:Date,
    }
})

const userModel = mongoose.model('User',userSchema)
export default userModel