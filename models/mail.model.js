const mongoose = require("mongoose");


const mailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  to: {
    type: String,
    required: true
  },
  billNo: {
    type: String,
    required: true
  },

}, { timestamps: true })


module.exports = mongoose.model("mailhistory", mailSchema)
