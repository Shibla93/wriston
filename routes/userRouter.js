const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const profileController = require("../controllers/user/profileController");

// Homepage & Auth
router.get("/", userController.loadHomepage);
router.get("/signup", userController.loadSignUp);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/pageNotFound", userController.pageNotFound);
router.get("/login", userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);

// 🟢 Google Authentication
router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] ,  prompt: 'select_account'})
);

router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {
    console.log("✅ Google login successful. User:", req.user); // Optional log
    req.session.user = req.user._id; // ✅ Save user ID to session
    res.redirect("/");
  }
);

// Homepage again (duplicate but okay)
router.get("/home", userController.loadHomepage);

// 🔒 Profile management
router.get("/forgot-password", profileController.getForgotPasspage);
router.post("/forgot-email-valid", profileController.forgotEmailValid);
router.post("/verify-passForgot-otp", profileController.verifyForgotPassOtp);
router.get("/reset-password", profileController.getResetpassPage);
router.post("/resend-forgot-otp", profileController.resendOtp);
router.post("/reset-password", profileController.postNewPassword);

module.exports = router;
