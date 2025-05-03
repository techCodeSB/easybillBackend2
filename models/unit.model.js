const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema({
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


const unitModel = new mongoose.model("unit", unitSchema);
module.exports = unitModel;
