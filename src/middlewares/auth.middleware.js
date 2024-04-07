import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// jya req, and next use thay pan res use no thay tyare _ kari nakhvu. like
// export const verifyJWT = asyncHandler( async (req,_,next) => {
export const verifyJWT = asyncHandler( async (req,res,next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
    if(!token){
     throw new ApiError(401, "Unauthorized request")
    }
 
 
    /*
    verify(token: string, secretOrPublicKey: jwt.Secret, options: jwt.VerifyOptions & { complete: true; }): jwt.Jwt
 
    Synchronously verify given token using a secret or a public key to get a decoded token token - JWT string to verify secretOrPublicKey - Either the secret for HMAC algorithms, or the PEM encoded public key for RSA and ECDSA. [options] - Options for the verification returns - The decoded token
    */
 
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECREAT)
 
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
    if(!user){
     throw new ApiError(401, "Invalid accessToken")
    }
 
     req.user = user;
     next()
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access Token")
   }

})