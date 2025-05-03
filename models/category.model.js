const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  tax: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tax",
    required: true
  },
  hsn: {
    type: String,
  },
  type: {
    type: String,
    required: true
  },
  details: {
    type: String,
  },
  isDel: {
    type: Boolean,
    default: false
  },
  isTrash:{
    type: Boolean,
    default: false
  }

}, { timestamps: true });


const categoryModel = new mongoose.model("category", categorySchema);
module.exports = categoryModel;
