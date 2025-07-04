const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Show Add Product Page
const getProductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });
    res.render("admin/product-add", {
      cat: category,
      brand: brand,
    });
  } catch (error) {
    console.error("Error loading product add page:", error);
    res.redirect("/pageError");
  }
};

// Add Product
const addProducts = async (req, res) => {
  try {
    const products = req.body;

    const productExists = await Product.findOne({ productName: products.productName });
    if (productExists) {
      return res.status(400).json("Product already exists, please try with another name");
    }

    const resizeDir = path.join("public", "uploads", "resize-image");
    if (!fs.existsSync(resizeDir)) {
      fs.mkdirSync(resizeDir, { recursive: true });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;
        const resizedFileName = "resized-" + req.files[i].filename;
        const resizedImagePath = path.join(resizeDir, resizedFileName);

        await sharp(originalImagePath)
          .resize({ width: 600, height: 600 })
          .toFile(resizedImagePath);

        images.push("resize-image/" + resizedFileName);
      }
    } else {
      return res.status(400).send("No images uploaded");
    }

    const categoryId = await Category.findOne({ name: products.category });
    if (!categoryId) {
      return res.status(400).send("Invalid category name");
    }

    const newProduct = new Product({
      productName: products.productName,
      description: products.description,
      brand: products.brand,
      category: categoryId._id,
      regularPrice: products.regularPrice,
      salePrice: products.salePrice,
      quantity: products.quantity,
      strapMaterial: products.strapMaterial,
      color: products.color,
      productImage: images,
      status: "Available",
      productOffer: 0, // default
    });

    await newProduct.save();
    console.log("Product saved successfully with images:", images);
    const cat = await Category.find({ isListed: true });
const brand = await Brand.find({ isBlocked: false });

return res.render("admin/product-add", {
  brand,
  cat,
  productAdded: true 
});


  
  } catch (error) {
    console.error("Error saving product:", error);
    return res.redirect("/pageError");
  }
};

// View all products
const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;

    const filter = {
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
      ],
    };

    const productData = await Product.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('category')
      .exec();

    const count = await Product.countDocuments(filter);

    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });

    if (category && brand) {
      res.render("admin/products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand
      });
    } else {
      res.render("admin-error");
    }
  } catch (error) {
    console.error("Error loading product list:", error);
    res.redirect("/pageError");
  }
};

// Add product offer
const addProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body;

    const findProduct = await Product.findById(productId);
    if (!findProduct) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    const findCategory = await Category.findById(findProduct.category);
    if (findCategory.categoryOffer > percentage) {
      return res.json({
        status: false,
        message: "This product's category already has a better offer",
      });
    }

    const discount = Math.floor(findProduct.regularPrice * (percentage / 100));
    findProduct.salePrice = findProduct.regularPrice - discount;
    findProduct.productOffer = parseInt(percentage);
    await findProduct.save();

    findCategory.categoryOffer = 0;
    await findCategory.save();

    console.log("Offer added to product:", findProduct);
    res.json({ status: true });
  } catch (error) {
    console.error("Error adding offer:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Remove product offer
const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;
    const findProduct = await Product.findById(productId);

    if (!findProduct) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    findProduct.salePrice = findProduct.regularPrice;
    findProduct.productOffer = 0;
    await findProduct.save();

    console.log("Offer removed from product:", findProduct);
    res.json({ status: true });
  } catch (error) {
    console.error("Error removing offer:", error);
    res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// Block product
const blockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/pageError");
  }
};

// Unblock product
const unblockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products");
  } catch (error) {
    res.redirect("/pageError");
  }
};

// Get edit product page
const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findOne({ _id: id });
    const category = await Category.find({});
    const brand = await Brand.find({});
    res.render("admin/edit-product", {
      product: product,
      cat: category,
      brand: brand,
    });
  } catch (error) {
    res.redirect("/pageError");
  }
};

// Edit product details
const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product=await Product.findOne({_id:id})
    const data = req.body;

    const existingProduct = await Product.findOne({
      productName: data.productName,
      _id: { $ne: id }
    });

    if (existingProduct) {
      return res.status(400).json({
        error: "Product with this name already exists. Please try another name"
      });
    }
     const resizeDir = path.join("public", "uploads", "resize-image");
    if (!fs.existsSync(resizeDir)) {
      fs.mkdirSync(resizeDir, { recursive: true });
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;
        const resizedFileName = "resized-" + req.files[i].filename;
        const resizedImagePath = path.join(resizeDir, resizedFileName);
         await sharp(originalImagePath)
          .resize({ width: 600, height: 600 })
          .toFile(resizedImagePath);

        images.push("resize-image/" + resizedFileName)

      }
    }

   

    
    const updateFields = {
      productName: data.productName,
      description: data.description,
      brand: data.brand,
      category: product.category,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      strapMaterial: data.strapMaterial,
      color: data.color,
      quantity:data.quantity,
    };

   if (images.length > 0) {
  updateFields.productImage = [...product.productImage, ...images];
}

    await Product.findByIdAndUpdate(id, updateFields, { new: true });
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error editing product:", error);
    res.redirect("/pageError");
  }
};

// Delete one image from product
const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer } = req.body;


    // Remove from MongoDB
    await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { productImage: imageNameToServer }
    });

    // Remove from filesystem
    const imagePath = path.join(__dirname, "../../public/uploads/resize-image", imageNameToServer);

    if (fs.existsSync(imagePath)) {
       await fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted successfully`);
    } else {
      console.log(`Image ${imageNameToServer} not found`);
    }

    res.send({ status: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.redirect("/pageError");
  }
};

module.exports = {
  getProductAddPage,
  addProducts,
  getAllProducts,
  addProductOffer,
  removeProductOffer,
  blockProduct,
  unblockProduct,
  getEditProduct,
  editProduct,
  deleteSingleImage
};
