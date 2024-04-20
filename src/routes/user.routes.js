import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeUserPassword, getCurrentUser, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)


// secured route (mean user must be login..)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-AccessToken").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeUserPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

// param mathi data aave tyare aa rite lakhva "/channel/:user---" 
router.route("/c/:username").get(verifyJWT, getUserChannelProfile),
router.route("/watch-history").get(verifyJWT, getWatchHistory)

export default router
