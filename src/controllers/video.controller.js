import mongoose, { isValidObjectId,ObjectId } from 'mongoose'
import {User} from '../models/user.models.js'
import {Video} from '../models/video.models.js'
import {ApiResponse} from '../utils/ApResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'

const getAllvideos =asyncHandler(async (req,res)=>{
    
    const user = await User.findById(req.user._id)
    
    if(!user){
        throw new ApiError(400,"User not found")
    }

    const allVideos = await Video.aggregate([
        {
            $match:{
                owner:user._id
            }   
        }
    ])

    res.status(200).json(new ApiResponse(200,allVideos,"fetched"))
})

const publishVideo = asyncHandler(async (req,res)=>{
    const {title,description}= req.body
    if(!title){
        throw new ApiError(400,"Title is required")
    }
    if(!description){
        throw new ApiError(400,"description is required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0].path
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path

    console.log("videoFileLocalPath :-", videoFileLocalPath);
    
    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnailLocalPath is required")
    }
    
    if(!videoFileLocalPath){
        throw new ApiError(400,"videoFileLocalPath is required")
    }
    

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(400,"Something went wrong while uploading videofile")
    }
    if(!thumbnail){
        throw new ApiError(400,"Something went wrong while uploading thumbnail")
    }

    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        isPublished:false,
        owner:req.user?._id 
    });

    const createdVideo = await Video.findById(video._id)
    if(!createdVideo){
        throw new ApiError(400,"Something went wrong while creating the video")
    }

    const idrebaba=createdVideo._id
    console.log("Id of the created video", idrebaba);
    

    res.status(200)
    .json(new ApiResponse(200,createdVideo,"Video created successfully"))
    

})

const getVideoById=asyncHandler(async (req,res)=>{
    const {videoId}= req.params

    // if(!isValidObjectId(videoId)){
    //     throw new ApiError(400,"video not found")
    // }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        return res.status(400).json({ error: "Invalid ObjectId" });
    }
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"No such video Exists")
    }

    return res.status(201)
    .json(new ApiResponse(200,video,"Video Fetched Successfully"))
});

const updateVideo = asyncHandler(async (req,res)=>{
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video not found")
    }

    const {title,description}= req.body

    if(title.trim() ===""){
        throw new ApiError(400,"Title is required")
    }
    if(description.trim() ===""){
        throw new ApiError(400,"Description is required")
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    console.log(thumbnailLocalPath);

    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail is required")
    }

    const videoThum = await findById(videoId)
    await deleteFromCloudinary(videoThum.thumbnail)

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400,"Something went wrong while uploading the thumbnail on cloudinary ")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:thumbnail.url
            },
        },
        {
            new:true
        }
    )

    return res
    .status(201)
    .json(new ApiResponse(200,video,"Video details updated successfully"))


})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId}= req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video not found")
    }

    const response=await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new ApiResponse(200,response,"Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async(req,res)=>{

    const {videoId}=req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video not found")
    }

    const video = await Video.findById(videoId)

    if(!req.user._id.equals(video.owner)){
        throw new ApiError(400,"You don not have this permission to delete this video")
    }

    video.isPublished=!video.isPublished;
    await video.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,video,"Toggled Published Status Successfully"))

})


export {
    publishVideo,
    getAllvideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}