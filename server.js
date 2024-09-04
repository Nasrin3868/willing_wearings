const express=require("express");
const app=express();
const bodyparser=require("body-parser")
const userrouter=require("./allRouters/userrouter")
const adminrouter=require("./allRouters/adminrouter")
const path=require("path")
const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
const loger=require("morgan")
// const otpgenerator=require("otp-generator")
const randomstring = require('randomstring');
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
require('dotenv').config()

const nocache=require("nocache")
app.use(nocache())

const static=path.join(__dirname+"/public")

app.set("views",__dirname+"/views")
app.use(loger("dev"))
app.use(express.static(static))
app.use(
    session({
      secret: uuidv4(),
      resave: false,
      saveUninitialized: false,
    })
  );



const port=process.env.port_no


app.set("view engine","ejs")
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use("/admin",adminrouter)
app.use("/",userrouter)

 

app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
});