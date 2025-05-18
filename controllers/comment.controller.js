import postModel from "../models/post.model.js";
import commentModel from "../models/comment.model.js";
import userModel from "../models/user.model.js"; 



//Get post specific comments

export const getPostComments = async (req, res) => {

    try {
        
        const userId= req.id;
        const postId = req.params.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const post = await postModel.findById(postId)
        .populate("author", "name email")
        .populate({
            path: "comments",
            populate: { path: "author", select: "name email" }
        })
        .populate("likes", "name");

        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        res.status(200).json({ success: true, comments: post });


    } catch (error) {
        console.log(error);
        res.status(500).json({
             success: false, 
             message: "Error fetching comments"
            
            });
    }

}


// add comment
export const addComment = async (req, res) => {
    try {
        const  postId  = req.params.id;
        const userId = req.id;
        const { text } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required in headers" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!text) {
            return res.status(400).json({ success: false, message: "Comment text is required" });
        }

        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: "Post not found" });
        }

        const newComment = new commentModel({ author: userId, post: postId, text });
        await newComment.save();

        post.comments.push(newComment._id);
        await post.save();

        res.status(201).json({ success: true, message: "Comment added", comment: newComment });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error adding comment", error: error.message });
    }
};

// like a comment
export const likeComment = async (req, res) => {
    try {
        const commentId  = req.params.id;
        const userId = req.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required in headers" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (comment.likes.includes(userId)) {
            return res.status(400).json({ success: false, message: "User already liked this comment" });
        }

        comment.likes.push(userId);
        await comment.save();

        res.status(200).json({ success: true, message: "Comment liked", comment });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error liking comment", error: error.message });
    }
};

// remove like from a comment
export const removeLikeFromComment = async (req, res) => {
    try {
        const commentId  = req.params.id;
        const userId = req.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required in headers" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (!comment.likes.includes(userId)) {
            return res.status(400).json({ success: false, message: "User has not liked this comment" });
        }

        comment.likes = comment.likes.filter(id => id.toString() !== userId);
        await comment.save();

        res.status(200).json({ success: true, message: "Like removed from comment", comment });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error removing like", error: error.message });
    }
};

// delete own comment
export const deleteComment = async (req, res) => {
    try {
        const commentId  = req.params.id;
        const userId = req.id;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required in headers" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const comment = await commentModel.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (comment.author.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this comment" });
        }

        await commentModel.findByIdAndDelete(commentId);
        await postModel.findByIdAndUpdate(comment.post, { $pull: { comments: commentId } });

        res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting comment", error: error.message });
    }
};

// function to get all comments of a user
export const getUserComments = async (req, res) => {
    try {
        const userId = req.id; // Get userId from headers

        if (!userId) {
            return res.status(400).json({ message: "User ID is required in headers" });
        }

        // Check if user exists
        const userExists = await userModel.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find all comments made by the user
        const userComments = await commentModel.find({ author: userId })
            .populate("post", "title") // Populate post details
            .sort({ createdAt: -1 }); // Sort by newest first

        res.status(200).json({
            success:true,
            userComments
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user comments", error });
    }
};
