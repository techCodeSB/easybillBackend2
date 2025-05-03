const mongoose = require("mongoose");

const accountSchema = mongoose.Schema({
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
  title: {
    type: String,
    required: true,
  },
  holderName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  ifscCode: {
    type: String,
  },
  bankName: {
    type: String,
  },
  openingBalance: {
    type: Number,
  },
  type: {
    type: String,
    enum: ['bank', 'cash', "cheque"],
    required: true,
  },
  details: {
    type: String,
  },
  isTrash: {
    type: Boolean,
    default: false,
  },
  isDel: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });


module.exports = mongoose.model("account", accountSchema);

