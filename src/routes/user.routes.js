import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeUserPassword, getCurrentUser} from "../controllers/user.controllers.js";
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

export default router
