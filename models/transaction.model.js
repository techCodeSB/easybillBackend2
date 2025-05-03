const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  transactionType: {
    type: String,
    required: true,
    enum:['income', 'expense']
  },
  purpose: {
    type: String,
    required: true
  },
  transactionNumber:{
    type: String,
    required: true
  },
  transactionDate: {
    type: String, 
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'bank', "cheque"],
    required: true
  },
  account:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: true
  },
  amount:{
    type:String,
    required: true
  },
  note:{
    type: String, 
  },
  isTrash: {
    type: Boolean,
    default: false
  },
  isDel:{
    type:Boolean,
    default: false
  }

}, { timestamps: true })


module.exports = new mongoose.model("transaction", transactionSchema);
