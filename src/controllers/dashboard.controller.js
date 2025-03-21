import mongoose,{isValidObjectId} from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";




const getChannelStats = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"totalVideos"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        }
    ])

    const views= await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{
                    $sum:"$views"
                }
            }
        },
        {
            $project:{
                _id:0,
                totalViews:1
            }
        }
    ])
    

return res
.status(200)
.json(new ApiResponse(200,
    {
        totalVideos:user[0].totalVideos.length,
        subscribers:user[0].subscribers.length,
        subscribedTo:user[0].subscribedTo.length,
        totalViews:views[0]?.totalViews || 0
    }
))
})




export {
    getChannelStats
}