import {asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApResponse.js"
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
    
        if(!user){
            throw new ApiError(404,"User not found")
        }
        
        const AccessToken = user.generateAccessTokens()
        // console.log(user);
        const RefreshToken = user.generateRefreshTokens()
        
        user.refreshtoken = RefreshToken
        await user.save({validateBeforeSave: false})
        return {AccessToken,RefreshToken}
    } catch (error) { 
        throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
    }
}
 
const loginUser = asyncHandler( async (req,res) => {
    // get data from user
    const {email,username,password} = req.body
    // console.log(req.body);
    
    if(!email){
        throw new ApiError(400,"Email1 is required")
    }
    if(!username){
        throw new ApiError(400,"Username is required")
    }
    if(!password){
        throw new ApiError(400,"Password is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }

    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404,"Invalid Password")
    }

    const {AccessToken,RefreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")

    if(!loggedInUser){
        throw new ApiError(404,"Useer not foundd")
    }

    const options={
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .cookie("accessToken", AccessToken,options)
    .cookie("refreshToken", RefreshToken,options)
    .json(new ApiResponse(200,
        {user:loggedInUser,AccessToken,RefreshToken},
        "User logged on successfully"))

})


const registerUser= asyncHandler(async (req,res)=>{
    const {fullname,email,username,password} = req.body

    //validation
    if(
        [fullname,email,username,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    // console.warn(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    let avatar;

    try {
        avatar =await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar",avatar);
        
        
    } catch (error) {
        console.log(`Error uploading avatar ${error}`);
        throw new ApiError(500,"Failed to upload avatar")
        
    }

    let  coverImage;
    try {
        coverImage =await uploadOnCloudinary(coverLocalPath)
        console.log("Uploaded avatar",coverImage);
        
        
    } catch (error) {
        console.log(`Error uploading coverimage ${error}`);
        throw new ApiError(500,"Failed to upload coverimage")
        
    }

    try {
        const user = await User.create({
            fullname,
            avatar:avatar.url,
            coverimage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase()
        })
        
        
        const createdUser=await User.findById(user._id).select(
            "-password -refreshtoken"
        )
        
    
        if(!createdUser){
            throw new ApiError(500,"Something went wrong while registering the user")
        }
    
        return res.status(201).json(new ApiResponse(200,createdUser,"User registered successfully"))
    } catch (error) {
        console.log("User creation failed",error);

        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500,"Something went wrong while registering the user and images were deleted")
        
    }

})

const refreshAccessToken = asyncHandler(async (req,res) => { 
    const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")

        }

        if(incomingRefreshToken !== user?.refreshtoken){
            throw new ApiError(401,"Invalid refresh token")

        }

        const options={ 
            httpOnly:true,
            secure: process.env.NODE_ENV ==="production"
        }

        const {AccessToken,RefreshToken:newRefreshToken}= await generateAccessAndRefreshToken(user._id)

        return res.status(200)
        .cookie("accessToken",AccessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{AccessToken,  RefreshToken:newRefreshToken},"Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(500,"Something went wring while refreshing the access token")
    }
})

const logoutUser = asyncHandler( async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshtoken:undefined,
            }
        },
        {new:true}
    )

    const options={ 
        httpOnly:true,
        secure: process.env.NODE_ENV ==="production"
    }

    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})
 
const changeCurrentPassword = asyncHandler( async(req,res)=>{
    const {oldPassword,newPassword}= req.body

    const user = await User.findById(req.body?._id)
    const isPasswordValid = user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(401,"Old password is incorrect")
    }

    user.password= newPassword;

    await User.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password updated succcessfully")
    )
})

const getCurrentUser = asyncHandler( async(req,res)=>{
    return res.status(200)
.json(
    new ApiResponse(200,req.user,"Current user details")
)
})

const updateAccountDetails = asyncHandler( async(req,res)=>{
    const {fullname,email}= req.body

    if(!fullname || !email){
        throw new ApiError(400,"Fullname and email are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        }
    ).select("-password -refreshtoken")

    res.status(200).json(
         new ApiResponse(200,user,"Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler( async(req,res)=>{
    const avatarLoaclPath=req.file?.path

    if(!avatarLoaclPath){
        throw new ApiError(400,"File is required")
    }

    const avatar = await uploadOnCloudinary(avatarLoaclPath)

    if(!avatar.url){
        throw new ApiError(500,"Something went wrong while uploading the avatar")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshtoken")

    res.status(200).json(new ApiResponse(200,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler( async(req,res)=>{
    const coverLoaclPath=req.file?.path

    if(!coverLoaclPath){
        throw new ApiError(400,"File is required")
    }

    const coverImage = await uploadOnCloudinary(coverLoaclPath)

    if(!coverImage.url){
        throw new ApiError(500,"Something went wrong while uploading the avatar")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:coverImage.url
            }
        },
        {new:true}
    ).select("-password -refreshtoken")

    res.status(200).json(new ApiResponse(200,"CoverImage updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{  
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"Username is required")
    }

   const channel = await User.aggregate(
    [
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"Subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"Subscription",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedTo:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                avatr:1,
                subscribersCount:1,
                channelSubscribedTo:1,
                isSubscribed:1,
                coverimage:1,
                email:1
            }
        }
    ]
   ) 

   if(!channel?.length){
    throw new ApiError(404,"channel not found")
   }
   console.log(channel);

   return res.status(200)
   .json(new ApiResponse(200,channel[0],"channel profile fetched successfully"))

})
const getWatchHistory = asyncHandler(async (req,res)=>{
    const user= await User.aggregate(
        [
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup:{
                    from:"Video",
                    localField:"watchhistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from:"Users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullname:1,
                                            username:1,
                                            avatar:1,
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"owner"     
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res.status(200).json(new ApiResponse(200,user[0]?.watchHistory,"Watch history fetched successfully "))
})
//  

export {registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}