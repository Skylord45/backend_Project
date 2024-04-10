import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiRespone } from "../utils/ApiResponse.js"
import { generateAccessTokenAndRefreshToken } from "../utils/genAccessAndRefresh.js";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler( async (req,res) => {

    //  steps to follow for register controller :-

    // (1)  get user details from front-end
    // (2)  validation for empty or not - email contain @ or not, password contain at least one capital latter,special char.,small letter etc,etc.
    // (3)  check user is exist or not -- by email, username
    // (4)  check for image, Avatar
    // (5)  upload image, avatar to cloudinary
    // (6)  create user object - create entry in db
    // (7)  check user creation
    // (8)  remove password and refreshToken field from respone
    // (9)  return respone


    // json thi data aave ae aapne req.body thi male..
     const {fullName, email, userName, password } = req.body
     console.log("email :" , email);



    //  handle file data..=> ( => check <= user.routes.js file  upload.fields([]))
// file direct handle no thay data ni jem aetle middleware ni help levi pade
// ane aapne khabar che ke "/register" hit thase tyare avatar & coverImage mali jase 


    // validations => empty
    // if(fullName === ""){
    //     throw new ApiError(400, "please enter valid userName")
    // }



    // user existed or not
    if (
        [fullName, email, userName, password].some((index) => 
        index?.trim === "")
    ) {
        throw new ApiError(400, "please enter all fields")
    }

    const existedUser = await User.findOne({
        $or : [{ userName },{ email }]
    })

    if(existedUser){
        throw new ApiError(409, "user is already exist")
    }

    
    // check for image and avatar
    const avatarLocalPath = await req.files?.avatar[0].path;
    // const coverImageLocalPath = await req.files?.coverImage[0].path;

    
    // we check for avatar but not check forcoverImage..
    let coverImageLocalPath; 
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = await req.files?.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(409, "avatar file is required ")
    }


    // upload to cludinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    

    if(!avatar){
        throw new ApiError(409, "avatar file is required ")
    }


    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url  || "",
        email,
        password,
        userName : userName.toLowerCase()
    })


    // check user creation && remove password and refreshToken field from respone .select pachi ae j che
    const createdUser = await User.findById(user._id).select( 
        "-password -refreshToken"
        )
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }


    // return respone
    return res.status(200).json(
        new ApiRespone(201, createdUser, "User registered successfully")
    )

} )

const loginUser = asyncHandler ( async (req,res) => {

     //  steps to follow for login user :-

    // (1) req.body => data
    // (2) userName or email
    // (3) find user
    // (4) password validation
    // (5) accessToken and refreshToken
    // (6) send cookie

    // req.body => data
    const {userName,email,password} = req.body


    // userName or email
    if(!(userName || email)) {
        throw new ApiError(400, "username or email is required")
    }
    
    //  here alternative code of above code.
    // => if we get both email & userName
    // if(!userName && !email) {
    //     throw new ApiError(400, "username or email is required")
    // }


    // find user
    const user = await User.findOne({
        $or : [{userName},{email}]
    })
    if(!user){
        throw new ApiError(404, "user does not exist")
    }

    // password validation
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user credentials")
    }


    // accessToken and refreshToken ni aapde jarur pasde to function banavi laiye.. 
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);


    // send cookie 

    // what respone data send to user ?
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  

    // cookie options
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiRespone(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler (async (req,res) => {

    // logout step to follow :-

    // (1) cookie's remove karvi pade
    // (2) db mathi accessToken and refreshToken pan reset karva pade 

    // logout time par aapde pase user ne kai rite find karvo bcz we don't access for any _id or anything have logout time par form to na baravay ke email and user name aapo.. to ae koi pan nu email nakhi logout karavi nakhe..
    // => like User.findById(_id)

    // aetle aapde use kari middleware (Jate se pehle milke jana !!)
    // ../middlewares/auth.middleware.js


    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespone(200, {}," user logged out !!"))

})

// user pase thi jyare access token expire thay to erroe aavse 401. to froent ne ak aevu code lakhavo pade jethi jo aeni pase 401 req. aave to ae backend ma end point hit kare and backend valo refreshtoken and user pase no refreshtoken same hoy to aene new accesstoken mali jase and session start thai jase..

const refreshAccessToken = asyncHandler(async(req, res) => {

    // step's to follow for refreshing accessToken..
    // (1) get token from req.cookie pase thi refreshToken
    // (2) have ae j refreshToken decode karvu db na token sathe compair karva
    // (3) compare both token 
    // (4) get new accessToken  


    // (1) get token from req.cookie pase thi refreshToken
    const incomingRefreshtoken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshtoken){
        throw new ApiError(401, "unauthorized request")
    }

    // (2) have ae j refreshToken decode karvu db na token sathe compair karva


    try {
        const decodedToken =  jwt.verify(
            incomingRefreshtoken, 
            process.env.REFRESH_TOKEN_SECREAT
        )
    
        // run this code also..(my logic)
        // if(!decodedToken){
        //     throw new ApiError(401, "unauthorized request")
        // }
    
        // if(incomingRefreshtoken !== decodedToken){
        //     throw new ApiError(401, "Invalid refreshToken" )
        // }
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh token")
        }
        
        // compair both token
        if(incomingRefreshtoken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        // till here we know both token is same so we generate new token
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
        
        // send token in cookie 
        
        // cookie sathe option hoy j..(options ne globly declear kari sakay bcz bov use thay che.)
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        // return respone
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiRespone(
                200,
                {accessToken, refreshToken : newRefreshTokoptionsen},
                "Access token refreshed !!"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


// change user password..
// (1) get old and new password from req.body
// (2) auth-middleware banavu j che aemathi req.user pase thi id lai sakay
// (3) old password and db password ne compare
// (4) add newPassword in user object


// think about it :-
// oldPassword aape che to aema thi id find kari sakay ?
// no bcz different user can be same password.. 

const changeUserPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    // set thyu password
    user.password = newPassword
    // save password
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiRespone(200, {} , "password change successfully"))
    
})


//  get current user
// auth-middleware pase already req.user che to aemathi direct respone aapi sakay

const getCurrentUser = asyncHandler (async (req, res) => {
    return res
    .status(200)
    .json(new ApiRespone(200, req.user, "current user fetched successfully") )
})


const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullName, email} = req.body

    if(!(fullName || email)){
        throw new ApiError(400, "all fields are required !!")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiRespone(200, user, "Account details updated successfully")
    )
})



// if we can upload file than make it in sepreate controller (avatar)

// middleware nu dhyan rakhvu 1st multer(file upload)& second auth(must login)
//  => file update. <=
// (1) req.file mathi avatar no path levo
// (2) cloudinary ma upload karvu
// (3) req.user mathi id kadhi user find karvo
// (4) user object ma avatar_ulr set karvo

const updateUserAvatar = asyncHandler( async (req,res) => {
    const avatarLocalPath = req.file?.path 
    
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar on cloudinary")
    }

    // update avatar user object
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            avatar : avatar.url
          }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiRespone(200, user , "Avatar updated successfully"))
})


// update coverImage file
const updateUserCoverImage = asyncHandler( async (req,res) => {

    const coverImageLocalPath = req.file?.path 
    
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage on cloudinary")
    }

    // update coverImage in user object
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            coverImage : coverImage.url
          }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiRespone(200, user , "Cover-Image updated successfully"))
})



export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,

}