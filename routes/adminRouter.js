
const express=require("express")
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const brandController=require("../controllers/admin/brandController")
const productController=require("../controllers/admin/productController");



const {userAuth,adminAuth}=require("../middlewares/auth")
 const multer=require("multer");
const storage=require("../helpers/multer")
const uploads=multer({storage:storage})


//login

router.get("/login",adminController.loadLogin)
router.post("/login",adminController.login)
router.get("/dashboard",adminAuth,adminController.loadDashboard);
 router.get("/logout",adminController.logout)

router.get("/pageError",adminController.pageError)
 //customer
 router.get("/users",adminAuth,customerController.customerInfo)
 router.get("/blockCustomer",adminAuth,customerController.customerBlocked)
 router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked)

//customers

router.get("/category",adminAuth,categoryController.categoryInfo)
router.post("/addCategory",adminAuth,categoryController.addCategory)
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer)
router.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer)
router.get("/listCategory",adminAuth,categoryController.getListcategory)
router.get("/unlistCategory",adminAuth,categoryController.getUnlistcategory)
router.get("/editCategory",adminAuth,categoryController.getEditcategory)
router.post("/editCategory/:id",adminAuth,categoryController.editCategory)




//brand
router.get("/brands",adminAuth,brandController.getBrandpage)
router.post("/addBrand",adminAuth,brandController.addBrand)
router.get("/blockBrand",adminAuth,brandController.blockBrand);
router.get("/unblockBrand",adminAuth,brandController.unBlockBrand)
router.get("/deleteBrand",adminAuth,brandController.deleteBrand)



//products
router.get("/addProducts",adminAuth,productController.getProductAddPage)
 router.post("/addProducts",adminAuth,uploads.array("images",4),productController.addProducts);
 router.get("/products",adminAuth,productController.getAllProducts);
 router.post("/addProductOffer",adminAuth,productController.addProductOffer);
 router.post("/removeProductOffer",adminAuth,productController.removeProductOffer)
 router.get("/blockProduct",adminAuth,productController.blockProduct);
router.get("/unblockProduct",adminAuth,productController.unblockProduct);
router.get("/editProduct",adminAuth,productController.getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),productController.editProduct)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)

module.exports=router
    



