const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema({
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
  gst: {
    type: String,
    required: true
  },
  cess: {
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
  isTrash: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });


const taxModel = new mongoose.model("tax", taxSchema);
module.exports = taxModel;
