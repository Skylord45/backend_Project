import mongoose, {Schema} from "mongoose"
import  Jwt  from "jsonwebtoken"
import  bcrypt  from "bcrypt"

const userSchema = new Schema(
    {
        userName :{
            type: String,
            required : true,
            unique : true,
            lowecase : true,
            index : true,
            trim : true
        },
        email:{
            type : String,
            required : true,
            unique : true,
            lowecase : true,
            trim : true
        },
        fullName:{
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar:{
            type : String,    // cloudinary url
            required : true
        },
        coverImage : {         // cloudinary url
            type : String,
        },
        watchHistory : [
            {
               type : mongoose.Types.ObjectId,
               ref :  "video"
            }
        ],
        password : {
            type : String,
            required : [true, "Password is required "],
        },
        refreshToken : {
            type : String,
        }
    },{timestamps: true})

// pre is a middlewares so we need nexxt flag
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
     return next()
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (){
  return Jwt.sign(
        {
            _id : this._id,
            emial : this.email,
            userName : this.userName,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECREAT,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
userSchema.methods.generateRefreshToken = function (){
  return Jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECREAT,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model("User", userSchema)