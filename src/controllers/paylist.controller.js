import mongoose, { isValidObjectId } from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Playlist} from "../models/playlist.models.js"
import {User} from "../models/user.models.js"

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name,description}= req.body

    if (!name) {
        throw new ApiError(400, "Name is Required");
      }
    
      if (!description) {
        throw new ApiError(400, "Description is Required");
      }

      const playlist = await Playlist.create({
        name,
        description,
        owner:req.user._id
      })

      if(!playlist){
        throw new ApiError(400,"something went wrong while creating the playlist")
      }

      return res
      .status(200)
      .json(new ApiResponse(200,playlist,"Playlist created successfully"))
    
})

const getUserPlaylists = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    console.log("UserId :-",userId);
    

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Playlist not found")
    }

    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup:{
                from:"playlists",
                localField:"_id",
                foreignField:"owner",
                as:"userPlaylists"
            }
        }
    ])
    console.log("aggregate User:-",user);

    // const user = await Playlist.find({
    //   owner:userId
    // })
    

    return res
    .status(200)
    .json(new ApiResponse(200,
        user[0].userPlaylists,
        "Playlist fetched successfully"
    ))
    // const playlist = await Playlist.find({
  //   owner: userId,
  // });

  // if (!playlist) {
  //   throw new ApiError(400, "User does not have any playlist");
  // }
//   return res
//   .status(200).json(new ApiResponse(200,playlist,"successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
  
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist Id");
    }
  
    const playList = await Playlist.findById(playlistId);
  
    if (!playList) {
      throw new ApiError(400, "No Such Playlist Exists");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, playList, "Playlist fetched successfully"));
  });


  const addVideoToPlaylist = asyncHandler(async(req,res)=>{
    const {playlistId,videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Id")
    }

    const playList = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    if (!playList) {
        throw new ApiError(
          400,
          "Something went wrong while adding video to playlist"
        );
      }

      return res
    .status(200)
    .json(new ApiResponse(200, playList, "Video Added SuccessFully"));

  })

  const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
  
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist id");
    }
  
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id");
    }
  
    const playlist = await Playlist.findById(playlistId);
  
    const index = playlist.videos.indexOf(videoId);
  
    if (index > -1) {
      // only splice array when item is found
      playlist.videos.splice(index, 1); // 2nd parameter means remove one item only
    }
  
    await playlist.save({ validateBeforeSave: false });
  
    // const video = await Video.findById(videoId);
  
    // if (!video) {
    //   throw new ApiError(404, "Video does not exist");
    // }
  
    // const playlist = await Playlist.findByIdAndUpdate(
    //   playlistId,
    //   {
    //     $pull: {
    //       videos: videoId,
    //     },
    //   },
    //   {
    //     new: true,
    //   }
    // );
  
    if (!playlist) {
      throw new ApiError(
        500,
        "Something went wrong while removing videos from playlist"
      );
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, playlist, "Video successfully removed from playlist")
      );
  });

  const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
  
    if (!playlistId) {
      throw new ApiError(400, "Invalid playlist Id");
    }
  
    await Playlist.deleteOne({ _id: playlistId });
  
    return res
      .status(200)
      .json(new ApiResponse(200, "Playlist deleted Successfully"));
  });

  const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
  
    if (!playlistId) {
      throw new ApiError(400, "Invalid playlist Id");
    }
  
    if (!name) {
      throw new ApiError(400, "Name is required");
    }
  
    if (!description) {
      throw new ApiError(400, "Description is required");
    }
  
    const playlist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: {
          name,
          description,
        },
      },
      {
        new: true,
      }
    );
  
    if (!playlist) {
      throw new ApiError(500, "Something went wrong while updating playlist");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist Updated successfully"));
  });

  export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
  }