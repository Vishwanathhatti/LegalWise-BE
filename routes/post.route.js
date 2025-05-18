import express from 'express';
import { addLike, createPost, getAllPosts, getLikedPosts, getSinglePost, getTrendingPosts, getUserPosts, removeLike, searchPosts } from '../controllers/post.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const postRouter = express.Router();

postRouter.route('/trending').get(getTrendingPosts); //Api to get trending posts
postRouter.route('/').post(verifyToken,createPost); // Api to create a post
postRouter.route('/').get(verifyToken,getAllPosts); // Api to get all posts
postRouter.route('/getpostbyid/:id').get(getSinglePost); // Api to get a single post
postRouter.route('/search').get(searchPosts); // Api to search posts by query
postRouter.route('/like/:id').put(verifyToken,addLike); // Api to like a post
postRouter.route('/unlike/:id').put(verifyToken,removeLike); // Api to unlike a post./
postRouter.route('/get/:id').get(verifyToken,getUserPosts); // Api to get posts by a user
postRouter.route('/likes/get').get(verifyToken,getLikedPosts); // Api to get liked posts

// create a route to update a post

export default postRouter;