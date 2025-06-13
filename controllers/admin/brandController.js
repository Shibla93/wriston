const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const getBrandpage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const brandData = await Brand.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBrands = await Brand.countDocuments();
    const totalpages = Math.ceil(totalBrands / limit);

    const reverseBrand = brandData.reverse();

    res.render("admin/brands", {
      data: reverseBrand,
      currentPage: page,
      totalpages: totalpages,
      totalBrands: totalBrands,
    });
  } catch (error) {
    console.error("Brand page error:", error);
    res.redirect("/pageError");
  }
};

const addBrand=async(req,res)=>{
    try {
        console.log("✅ Brand POST called");
    console.log("📦 req.body:", req.body);
       const brand=req.body.name
    
        const findBrand=await Brand.findOne({brandName:brand});
       if(!findBrand){
        const newBrand=new Brand({
            brandName:brand,
        })
        await newBrand.save()
    
        res.redirect("/admin/brands")
       }
    } catch (error) {
        
        res.redirect("/pageError")
    }
}


const blockBrand=async(req,res)=>{
  try {
    const id=req.query.id;
    await Brand.updateOne({_id:id},{$set:{isBlocked:true}})
    res.redirect("/admin/brands")
  } catch (error) {
    
  }
}


const unBlockBrand=async(req,res)=>{
  try {
    const id=req.query.id;
    await Brand.updateOne({_id:id},{$set:{isBlocked:false}})
    res.redirect("/admin/brands")
  } catch (error) {
    res.redirect("/pageError")
 }
}


const deleteBrand=async(req,res)=>{
  try {
    const id=req.query.id;
    if(!id){
      return res.status(400).redirect("/pageError")
    }
    await Brand.deleteOne({_id:id});
    res.redirect("/admin/brands")
  } catch (error) {
    console.error("Error deleting brand:",error);
    res.status(500).redirect("/pageError")
  }
}

module.exports = {
  getBrandpage,
  addBrand,
  blockBrand,
  unBlockBrand,
  deleteBrand
};
