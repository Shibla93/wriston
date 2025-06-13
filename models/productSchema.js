
const mongoose=require("mongoose");
const {Schema}=mongoose;

const productShema=new Schema({
    productName:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,required:true
    },
   quantity:{
    type:Number,
    required:true
   },
    StrapeMaterial:{
        type:String,
        requied:true
    },
    color:{
        type:String,
        required:true
    },
    productImage:{
        type:[String],
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock","Discountinued"],
        required :true,
        default:"Available"
    },
    productOffer: { // 💡 Offer Percentage
        type: Number,
        default: 0,
    }
},{timeStamps:true});

const Product=mongoose.model("Product",productShema);
module.exports=Product;