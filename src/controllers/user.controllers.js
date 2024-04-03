import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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



    //  handle file data...(check user.routes.js file  upload.fields([]))

    


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

    const existedUser = User.findOne({
        $or : [{ userName },{ email }]
    })

    if(existedUser){
        throw new ApiError(409, "user is already exist")
    }

    
    // check for image and avatar
    const avatarLocalPath = await req.files?.avatar[0].path;
    const coverImageLocalPath = await req.files?.coverImage[0].path;

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
        new ApiResponse(201, createdUser, "User registered successfully")
    )

} )

export {registerUser}