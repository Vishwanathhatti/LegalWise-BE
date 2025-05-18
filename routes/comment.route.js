import express from 'express';
import { addComment, deleteComment, getPostComments, getUserComments, likeComment, removeLikeFromComment } from '../controllers/comment.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const commentRouter = express.Router();

commentRouter.route('/:id').get(verifyToken,getPostComments); // Api to get comments of a post
commentRouter.route('/addLike-comment/:id').put(verifyToken,likeComment); // Api to like a comment
commentRouter.route('/removeLike-comment/:id').put(verifyToken,removeLikeFromComment); // Api to unlike a comment
commentRouter.route('/add-comment/:id').post(verifyToken,addComment); // Api to add a comment
commentRouter.route('/remove-comment/:id').delete(verifyToken,deleteComment); // Api to delete a comment
commentRouter.route('/user-comments/:id').get(verifyToken,getUserComments); // Api to get all comments of a user

export default commentRouter;