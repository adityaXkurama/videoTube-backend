import {ApiResponse} from '../utils/ApResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'


const healthcheck = asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,"OK","Health check passed","true"))
})

export {healthcheck }  