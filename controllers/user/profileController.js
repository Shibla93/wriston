const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");

// Generate a 6-digit OTP
function generateOtp() {
    const digits = "1234567890";
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

// Send email with OTP
const sendVerificationEmail = async (email, otp) => {
    try {
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

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Your OTP for password reset",
            html: `<b>Your OTP: ${otp}</b>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
};

// Hash the password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.error("Error hashing password", error);
    }
};

// Render forgot password page
const getForgotPasspage = async (req, res) => {
    try {
        res.render("forgot-password");
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

// Validate email and send OTP
const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });

        if (findUser) {
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email, otp);

            if (emailSent) {
                req.session.userOtp = otp;
                req.session.email = email;
                res.render("forgotPass-otp");
                console.log("OTP:", otp);
            } else {
                res.json({ success: false, message: "Failed to send OTP. Please try again." });
            }
        } else {
            res.render("forgot-password", {
                message: "User with this email does not exist",
            });
        }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

// Verify OTP entered by user
const verifyForgotPassOtp = async (req, res) => {
    try {
        const enteredOtp = req.body.otp;

        if (!req.session.userOtp) {
            return res.json({ success: false, message: "Session expired. Please resend OTP." });
        }

        if (enteredOtp === req.session.userOtp) {
            res.json({ success: true, redirectUrl: "/reset-password" });
        } else {
            res.json({ success: false, message: "OTP not matching" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred, please try again" });
    }
};

// Render reset password page
const getResetpassPage = async (req, res) => {
    try {
        res.render("reset-password");
    } catch (error) {
        res.redirect("/pageNotFound");
    }
};

// Resend OTP
const resendOtp = async (req, res) => {
    try {
        const otp = generateOtp();
        req.session.userOtp = otp;
        const email = req.session.email;

        if (!email) {
            return res.status(400).json({ success: false, message: "No email found in session." });
        }

        console.log("Resending OTP to email:", email);

        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resent OTP:", otp);
            res.status(200).json({ success: true, message: "Resent OTP successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP" });
        }
    } catch (error) {
        console.error("Error in resend OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Save new password
const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;

        if (newPass1 === newPass2) {
            const passwordHash = await securePassword(newPass1);

            await User.updateOne(
                { email: email },
                { $set: { password: passwordHash } }
            );

            // Optionally destroy session after reset
            req.session.destroy();

            res.redirect("/login");
        } else {
            res.render("reset-password", { message: "Passwords do not match" });
        }
    } catch (error) {
        console.error("Error resetting password:", error);
        res.redirect("/pageNotFound");
    }
};

module.exports = {
    getForgotPasspage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetpassPage,
    resendOtp,
    postNewPassword,
};
