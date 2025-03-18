import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req,res)=>{

    const {content}=req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const tweet =await Tweet.create({
        content,
        owner:req.user._id
    })

    if(!tweet){
        throw new ApiError(400,"Something went wrong while creating the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet created successfully"))
    
})

const getUserTweets = asyncHandler(async(req,res)=>{
    const {userId} = req.params

    const tweets = await Tweet.find({owner:userId})

    if(!tweets){
        throw new ApiError(400,"No tweets exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweets,"Tweets fetched uccessfully"))

})

const updateTweet = asyncHandler(async(req,res)=>{
    const {newContent}=req.body
    const {tweetId}=req.params

    if (!isValidObjectId(tweetId)) {
        return new ApiError(400, "Tweet Does Not Exist");
    }
    
    if (!newContent) {
        return new ApiError(400, "Content is Required");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:newContent
            }
        },
        {
            new:true
        }
    )

    if(!updatedTweet){
        throw new ApiError(400,"Something went wrong while updating the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId}= req.params

    if (!isValidObjectId(tweetId)) {
        return new ApiError(400, "Tweet Does Not Exist");
    }

    const response = await Tweet.findByIdAndDelete(tweetId)

    if(!response){
        throw new ApiError(400,"Something wentwrong while deleting the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,response,"Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}