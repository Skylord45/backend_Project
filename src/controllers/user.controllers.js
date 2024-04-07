import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiRespone } from "../utils/ApiResponse.js"
import { generateAccessTokenAndRefreshToken } from "../utils/genAccessAndRefresh.js";

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
        index?.trim() === "")
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

    // what respone data send ?
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

export {
    registerUser, 
    loginUser,
    logoutUser

}