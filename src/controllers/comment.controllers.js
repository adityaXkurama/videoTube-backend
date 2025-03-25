import { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    let { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Invalid video Id");
  }

  page = Number(page);
  limit = Number(limit);

  if (!Number.isFinite(page)) {
    throw new ApiError(400, "Page is required");
  }

  if (!Number.isFinite(limit)) {
    throw new ApiError(400, "Limit is required");
  }

  const allComments = await Comment.aggregate([
    {
        $match:{
            video:videoId
        }
    },
  ])

  const comments = await Comment.aggregatePaginate(
    allComments,{page,limit}
  )

  return res
  .status(200)
  .json(
    new ApiResponse(200,comments,"comments fetched for the video")
  )

}) 
 
const addComment = asyncHandler(async(req,res)=>{
  const {videoId} = req.params
  const userId=req.user._id
  const content=req.body.content
  console.log("videoId is :-",videoId);
  console.log("Content is :-",content);
  

  if(!isValidObjectId(videoId)){
    throw new ApiError(400,"Video not found")
  }

  if(!content){
    throw new ApiError(400,"Content is required")
  }

  const comment = await Comment.create({
    content,
    video:videoId,
    owner:userId
  })

  const createdComment = await Comment.findById(comment._id)

  if(!createdComment){
    throw new ApiError(400,"Something went wrong while creating the comment")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,createdComment,"Comment created successfully")
  )

}) 
 
const updateComment = asyncHandler(async(req,res)=>{
  const {commentId}=req.params
  const {newContent}=req.body

  if(!newContent.trim() === ""){
    throw new ApiError(400,"Content is required")
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set:{
        content:newContent
      },
    },
    {
      new:true,
    }
  )

  if (!updatedComment) {
    throw new ApiError(400, "failed to update Comment");
  }

  return res
  .status(200)
  .json(200,updatedComment,"Comment updated successfully")


}) 
  

const deleteComment = asyncHandler(async(req,res)=>{
  const {commentId}= req.params
  const userId = req.user._id

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }


  const comment = await Comment.findById(commentId)
  if(!userId.equals(comment.owner)){
    throw new ApiError(400,"You do not have the permission to delete this comment")
  }

  const response = await Comment.findByIdAndDelete(commentId)

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment Deleted SuccessFully"));


}) 

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}