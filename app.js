
const express = require("express");
const app = express();
const path = require("path");
const env=require("dotenv").config();
const session=require("express-session")
const passport=require("./config/passport")
 const connectDB=require ("./config/db");
 const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")


 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize())
app.use(passport.session())

app.use((req,res,next)=>{
  res.set('cache-control','no-store')
  next()
})


app.set("view engine", "ejs");
// // 
app.set("views",[ path.join(__dirname, "views/user"),path.join(__dirname,'views/')]);
//app.set("views", path.join(__dirname, "views"));

 app.use(express.static(path.join(__dirname, 'public')));

  


app.use("/",userRouter);
app.use("/admin",adminRouter)


app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack);
  const view = req.originalUrl.startsWith("/admin") ? "admin/error" : "user/error";
  res.status(500).render(view, { message: err.message || "Internal Server Error" });
});

const PORT= process.env.PORT||3000
connectDB().then(() => {
app.listen(PORT, () => {
    console.log(" server running")
});
})


module.exports=app;


