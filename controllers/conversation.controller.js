import conversationModel from "../models/conversation.model.js";

export const createConversation = async (req,res)=>{

    try {
        const {title}= req.body;
        const userId = req.id;
        if(!title){
            return res.status(400).json({
                message:"Something is missing",
                success:false
            })
        }

        if(!userId){
            return res.status(400).json({
                message:'Could not fetch userId',
                success:false
            })
        }

        const conversation = await conversationModel.create({
            title,
            user: userId
        })
        res.status(200).json({
            message:'Conversation created successfully',
            conversation,
            success:true
        })
     
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"Something went wrong",
            success:false
        })
    }

}


//Function to get all conversations
export const getUserConversations = async(req,res)=>{
    try {
        const userId= req.id
        if(!userId){
            return res.status(400).json({
                message:'Unable to fetch userId',
                success:false
            })
        }

        const allConversation= await conversationModel.find({user:userId}).populate({
            path: "messages",
            model: "Message",
            select: "role content timestamp",
            options: { sort: { timestamp: 1 }},
          })

        if(!allConversation){
            return res.status(400).json({
                message:"No Conversation's were found",
                success:false
            })
        }

        res.status(200).json({
            allConversation,
            success:true
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:'Something went wrong',
            success:false
        })
    }
}


//Function to get current conversation
export const getCurrentConversation = async(req,res)=>{
    try {
        const conversationId = req.params.id;
        const userId= req.id
        if(!userId){
            return res.status(400).json({
                message:'Unable to fetch userId',
                success:false
            })
        }

        const conversation= await conversationModel.findById(conversationId).populate({
            path: "messages",
            model: "Message",
            select: "role content timestamp",
            options: { sort: { timestamp: 1 }},
          })

        if(!conversation){
            return res.status(400).json({
                message:"Conversation not found",
                success:false
            })
        }

        res.status(200).json({
            conversation,
            success:true
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:'Something went wrong',
            success:false
        })
    }

}