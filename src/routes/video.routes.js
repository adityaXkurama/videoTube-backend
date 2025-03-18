import { Router } from "express";
import {upload} from '../middlewares/multer.middlewares.js'
import {verifyJWT} from '../middlewares/auth.middlewares.js'
import { getAllvideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus 
} from "../controllers/video.controller.js";


const router=Router()
router.use(verifyJWT)
//unsecured routes

router.route("/").get(getAllvideos).post(upload.fields([
    {
        name:"videoFile",
        maxCount:1 
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishVideo)

router.route('/:videoId')
.get(getVideoById)
.delete(deleteVideo)
.patch(upload.fields([{name:"thumbnail",
    maxCount:1
}]),updateVideo)


router.route('/toggle/publish/:videoId')
.patch(togglePublishStatus)




//secured routes
    

export default router