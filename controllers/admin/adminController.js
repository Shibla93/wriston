
const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const pageError=async(req,res)=>{
    res.render("admin/admin-error",{ message: 'Something went wrong' })
}

const loadLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin/dashboard");
    }
    res.render("admin/login", { message: null }); // ✅ Correct path
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await User.findOne({ email, isAdmin: true });
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);

            if (passwordMatch) {
                req.session.admin = true;
                req.session.adminId = admin._id;
                return res.redirect("/admin/dashboard");
            } else {
                return res.render("admin/login", { message: "Incorrect password" }); // ✅ Fixed
            }
        } else {
            return res.render("admin/login", { message: "Admin not found" }); // ✅ Fixed
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.redirect("/pageError");
    }
};

const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            res.render("admin/dashboard"); // ✅ Assume it's in admin folder
        } catch (error) {
            console.error("Dashboard error:", error);
            res.redirect("/pageError");
        }
    } else {
        res.redirect("login");
    }
};


const logout=async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
console.log("Error destroying session",err)
return res.redirect("/pageError")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
      console.log("unexpected error during logout",error) 
      res.redirect ("/pageError")
    }
}
module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,logout
};
