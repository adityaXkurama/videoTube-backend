import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {Subscription} from "../models/subscription.models.js"

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

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:channelId
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
            subscribers:subscribers.subscribers,
            numOfSubscribers:subscribers.subscribers.length()
        },
        "channel subscriber fetched"
    ))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
  
    if (!isValidObjectId(subscriberId)) {
      throw new ApiError(400, "Subscriber does not exist");
    }
  
    const subscriber = await Subscription.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(subscriberId),
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
          subscriber[0].channelsSubscribedTo,
          "Successfully fetched the number of channels user is subscribed to"
        )
      );
  });


  export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
  }