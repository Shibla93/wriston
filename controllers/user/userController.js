const User = require("../../models/userSchema");
const Product=require("../../models/productSchema")
const Category=require("../../models/categorySchema")
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// 404 page
const pageNotFound = async (req, res) => {
  try {
    return res.render("page-404");
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
};

// Home page
const loadHomepage = async (req, res) => {
  try {
    const userId = req.session.user;
    const categories=await Category.find({isListed:true});
    let productData=await Product.find({isBlocked:false,
      category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
    })

    productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn||0));
productData=productData.slice(0,4);


    if (userId) {
      const userData = await User.findOne({ _id: userId });
      return res.render("home", { user: userData ,products:productData});
    } else {
      return res.render("home",{products:productData});
    }
  } catch (error) {
    console.log("Home page not found:", error);
    return res.status(500).send("server error");
  }
};

// Signup page
const loadSignUp = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("Signup page not loading:", error);
    return res.status(500).send("server error");
  }
};

// OTP generator
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendVerificationEmail(email, otp) {
  try {
    console.log("📧 Preparing to send email to:", email);
    console.log("📬 Sending OTP:", otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });

    console.log("📬 Message ID:", info.messageId);
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Signup controller
const signup = async (req, res) => {
  try {
    console.log("➡️ Signup controller hit");
    const { name, phone, email, password } = req.body;
    const Confirmpassword = req.body["confirm-password"];

    if (password !== Confirmpassword) {
      return res.render("signup", { message: "Passwords do not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("signup", {
        message: "User with this email already exists",
      });
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password };

    console.log("✅ OTP stored in session:", req.session.userOtp);
    return res.render("verify-otp");
  } catch (error) {
    console.error("❌ Signup error:", error);
    return res.redirect("/pageNotFound");
  }
};

// Hash password
const securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error("❌ Password hashing error:", error);
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const saveuserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
      });

      await saveuserData.save();
      req.session.user = saveuserData._id;
      return res.json({ success: true, redirectUrl: "/" });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP, please try again",
      });
    }
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during OTP check",
    });
  }
};

// Resend OTP

const resendOtp = async (req, res) => {
  console.log("🔁 Resend OTP endpoint hit");
  try {
    // ✅ First check if session and userData exist
    if (!req.session || !req.session.userData || !req.session.userData.email) {
      return res.status(400).json({
        success: false,
        message: "Email not found in session",
      });
    }

    const { email } = req.session.userData;

    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP, please try again",
      });
    }
  } catch (error) {
    console.error("❌ Error resending OTP", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again",
    });
  }
};
    const otp = generateOtp();
    
// Load login page
const loadLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      return res.redirect("/");
    }
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Received email:", email);
    console.log("Received password:", password);
    const findUser = await User.findOne({ isAdmin: 0, email });

    if (!findUser) {
      return res.render("user/login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("login", { message: "User is blocked by admin" });
    }

    if (!password || !findUser.password) {
      return res.render("/login", { message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("login", { message: "Incorrect Password" });
    }

    req.session.user = findUser._id;
    return res.redirect("/home");
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).render("login", {
      message: "Internal server error. Please try again.",
    });
  }
};
//logout
const logout=async (req,res)=>{
  try {
    req.session.destroy((err)=>{
      if(err){
        console.log("session destruction error",err.message)
        res.redirect("/pageNotFound")
      }
      return res.redirect("/login")
    })
  } catch (error) {
    console.log("logout error",error);
    res.redirect("/pageNotFound")
  }
}

module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignUp,
  signup,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  logout
};
