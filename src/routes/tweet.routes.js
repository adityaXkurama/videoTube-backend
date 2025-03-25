import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

import { 
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
 } from "../controllers/tweet.controller.js";

 const router = Router()
 router.use(verifyJWT)


 
 router.route('/')
 .post(createTweet) 
 router.route('/users/:userId').get(getUserTweets)
  
 router.route('/:tweetId')
 .patch(updateTweet)
 .delete(deleteTweet)


 
 export default router 