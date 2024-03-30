import mongoose, {Schema, trusted} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile : {
            type : String,         // cloudinary url
            required : true,
        },
        thumbnail : {             // cloudinary url
            type : String,
            required : true
        },
        title: {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : Number,
            required : true
        },
        view : {
            type : Number,
            default : 0,
            required : true 
        },
        isPublished : {
            type : String,
            default : true
        },
        owner : {
            type : mongoose.Types.ObjectId,
            ref : "User"
        }        
    },
    {
        timestamps : true,
    })

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)