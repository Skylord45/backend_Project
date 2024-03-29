import express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))


// handle data from json
app.use(express.json({limit:'16kb'}))
// from url..
app.use(express.urlencoded({extended: true, limit:'16kb'}))
// assest like pdf, img, fevicon etc..
app.use(express.static("public"))
// server thi user cookie access oan thay and set pan thay..
// CRUD operation on cookie only by server..
app.use(cookieParser())



export {app}