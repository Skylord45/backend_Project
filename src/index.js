// require('dotenv').config({path : './env'})
// As early as possible in your application, import and configure dotenv:



import dotenv from "dotenv"
import connectDB from "./db/index1.js"

dotenv.config({
    path: './.env'
})

// this is experimental so change in json file



connectDB()




















/*
import { Express } from "express";

const app =  express();

;( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("application not able to talk to database !!", error);
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`app is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR : ", error);
        throw error;
    }
})()
*/