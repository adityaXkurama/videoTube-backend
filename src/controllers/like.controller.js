import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

import {Tweet} from "../models/tweet.models.js"
import {Video} from "../models/video.models.js"
import {Comment} from "../models/comment.models.js"


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video does not exist")
    }

    const video = await Video.findById(videoId);
  
    if (!video) {
      throw new ApiError(404, "Video does not exist");
    }

    const userId = req.user._id

    let like,unLike;

    const isLiked = await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    if(isLiked){
        unLike = await Like.deleteOne({
            video:videoId
        })

        if(!unLike){
            throw new ApiError(400,"Something went wrong while Unliking the video")
        }
    }else{
        like = await Like.create({
            video:videoId,
            likedBy:userId
        })
        if(!like){
            throw new ApiError(400,"Something went wrong while liking the video")
        }

    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        like || unLike,
        "Toggled video like successully"
    ))
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
      }


      const tweet = await Tweet.findById(tweetId);
  
    if (!tweet) {
      throw new ApiError(404, "Tweet does not exist");
    }
    const userId = req.user._id

    
    const isLiked = await Tweet.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    let like,unLike;
    if(isLiked){
        unLike = await Like.deleteOne({
            tweet:tweetId
        })

        if(!unLike){
            throw new ApiError(400,"Something went wrong while unliking the tweet")
        }
    }else{
        like = await Like.create({
            tweet:tweetId,
            likedBy:userId
        })

        if(!like){
            throw new ApiError(400,"Something went wrong while liking the tweet")
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        like || unLike,
        "Toggled tweet like successfully"
    ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

  
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment Id");
    }
  
    const comment = await Comment.findById(commentId);
  
    if (!comment) {
      throw new ApiError(404, "comment does not exist");
    }
  
    let like, unlike;
  
    const isLiked = await Like.findOne({
      comment: commentId,
      likedBy: userId,
    });
  
    if (isLiked) {
      unlike = await Like.deleteOne({
        comment: commentId,
      });
  
      if (!unlike) {
        throw new ApiError(
          500,
          "Something went wrong while unliking the comment"
        );
      }
    } else {
      like = await Like.create({
        comment: commentId,
        likedBy: userId,
      });
  
      if (!like) {
        throw new ApiError(500, "Something went wrong while liking the comment");
      }
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, like || unlike, "Toggled comment like successfully")
      );
  });

  const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
   
    const videos = await Like.find({
      likedBy: req.user._id, 
      video: { $exists: true },
    });
  
    if (!videos) {
      throw new ApiError(400, "No Liked videos found"); 
    }
   
    return res 
      .status(200) 
      .json(
        new ApiResponse( 
          200, 
          { numOfVideos: videos.length, videos },
          "Liked videos Fetched Successfully"
        ) 
      ); 
  });
