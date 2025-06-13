
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

// Show paginated category list
const categoryInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    res.render("admin/category", {
      cat: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageError");
  }
};

// Add new category
const addCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const newCategory = new Category({
      name,
      description,
    });

    await newCategory.save();
    return res.json({ message: "Category added successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add offer to a category
const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage);
    const categoryId = req.body.categoryId;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    const products = await Product.find({ category: category._id });

    const hasBetterProductOffer = products.some(
      (product) => product.productOffer > percentage
    );

    if (hasBetterProductOffer) {
      return res.json({
        status: false,
        message: "One or more products already have better offers",
      });
    }

    // Update category offer
    await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

    // Update product sale prices and reset individual offers
    for (const product of products) {
      product.productOffer = percentage;
      product.salePrice = Math.floor(product.regularPrice * (1 - percentage / 100));
      await product.save();
    }

    res.json({ status: true });
  } catch (error) {
    console.error("Add category offer error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Remove offer from a category
const removeCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    const percentage = category.categoryOffer || 0;
    const products = await Product.find({ category: category._id });

    if (products.length > 0) {
      for (const product of products) {
        product.salePrice = product.regularPrice;
        product.productOffer = 0;
        await product.save();
      }
    }

    category.categoryOffer = 0;
    await category.save();

    res.json({ status: true });
  } catch (error) {
    console.error("Remove category offer error:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const getListcategory=async(req,res)=>{
    try {
        let id=req.param.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}})
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const getUnlistcategory=async(req,res)=>{
    try {
       let id=req.params.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}})
        res.redirect("/admin/category")
    } catch (error) {
       res.redirect("/pageerror") 
    }
}

const getEditcategory=async(req,res)=>{
  try {
    let id=req.params.id||req.query.id;
    const category=await Category.findOne({_id:id});
    res.render("admin/edit-category",{category:category})
  } catch (error) {
    res.redirect("/pageerror")
  }
}


const editCategory=async(req,res)=>{
  try {
    const id=req.params.id;
    const{categoryName,description}=req.body  ;
    const existingCategory=await Category.findOne({name:categoryName})
    if(existingCategory){
      return res.status(400).json({error:"Category exists,please choose another name"})
    }
const updateCategory=await Category.findByIdAndUpdate(id,{
  name:categoryName,
  description:description
},{new:true});
if(updateCategory){
  res.redirect("/admin/category")
}else{
  res.status(404).json({error:"Category not found"})
}

  } catch (error) {
    res.status(500).json({error:"Internal Server error"})
  }
}

module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer,
  getListcategory,
  getUnlistcategory,
  getEditcategory,
  editCategory,

};
