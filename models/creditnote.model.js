const mongoose = require("mongoose");


const itemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  hsn: {
    type: String
  },
  qun: {
    type: String,
    required: true
  },
  selectedUnit: {
    type: String,
    required: true
  },
  unit: {
    type: Array,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  discountPerAmount: {
    type: String,
  },
  discountPerPercentage: {
    type: String,
  },
  tax: {
    type: String,
    required: true
  },
  taxAmount: {
    type: String,
  },
  amount: {
    type: String,
  },
}, { _id: false });

const additionalChargeSchema = new mongoose.Schema({
  particular: {
    type: String
  },
  amount: {
    type: String
  }
}, { _id: false });

const creditNoteSchema = new mongoose.Schema({
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
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party',
    required: true
  },
  creditNoteNumber: {
    type: String,
    required: true
  },
  creditNoteDate: {
    type: Date,
    required: true
  },
  items: {
    type: [itemSchema],
    required: true
  },
  discountType: {
    type: String,
  },
  discountAmount: {
    type: String,
  },
  discountPercentage: {
    type: String,
  },
  additionalCharge: {
    type: [additionalChargeSchema],
  },
  note: {
    type: String,
  },
  terms: {
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

module.exports = mongoose.model("creditnote", creditNoteSchema);
