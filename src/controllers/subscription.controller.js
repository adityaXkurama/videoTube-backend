import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {Subscription} from "../models/subscription.models.js"
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId}= req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel does not exist");
    }

    let subscribe,unsubscribe;

    const isSubscribed = await Subscription.findOne({
        channel:channelId,
        subscriber:req.user?._id
    })

    if(!isSubscribed){
        subscribe = await Subscription.create({
            channel:channelId,
            subscriber:req.user._id
        })

        if(!subscribe){
            throw new ApiError(400,"Something went wrong while subscribing")
        }
    }else{
        unsubscribe= await Subscription.deleteOne({
            channel:channelId,
            subscriber:req.user._id
        })
        if(!unsubscribe){
            throw new ApiError(400,"Something went wrong while subscribing")
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,
        subscribe || unsubscribe,
        "Subscription toggled successfully"
    ))

})

const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    console.log("Channel id for subscription",channelId);
    

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscribers:{
                    $first:"$subscribers"
                }
            }
        }
    ])

    console.log(subscribers);
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {
            subscribers:subscribers,
            numOfSubscribers:subscribers.length
        },
        "channel subscriber fetched"
    ))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  
    if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Subscriber does not exist");
    }
  
    const subscriber = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "channelsSubscribedTo",
        },
      },
    ]);
  
    if (!subscriber) {
      throw new ApiError(404, "The subscriber does not exist");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriber[0].channelsSubscribedTo.length,
          "Successfully fetched the number of channels user is subscribed to"
        )
      );
  });


  export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
  }