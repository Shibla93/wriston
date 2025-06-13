
const mongoose=require("mongoose")
const {Schema}=mongoose
const {v4:uuidv4}=require('uuid');
const orderSchema=new Schema({
    orderId:{
        type:String,
        defualt:()=>uuidv4,
        unique:true
    },
    orderedItems:[{

        product:{
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:['pending','shipped','delivered','cancelled','return request',"returned"]
    },
    createdOn:{
        type:Date,
        defult:Date.now,
        required:true
    },
    coupenAppllied:{
        type:Boolean,default:false
    }
})

const Order=mongoose('Order',orderSchema)
module.exports=Order
