const mongoose = require("mongoose");


const itemSchema = new mongoose.Schema({
  itemName: {
    type: String
  },
  description: {
    type: String
  },
  hsn: {
    type: String
  },
  qun: {
    type: String
  },
  selectedUnit: {
    type: String
  },
  unit: {
    type: Array
  },
  price: {
    type: String
  },
  discountPerAmount: {
    type: String
  },
  discountPerPercentage: {
    type: String
  },
  tax: {
    type: String
  },
  taxAmount: {
    type: String
  },
  amount: {
    type: String
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

const salesInvoiceSchema = new mongoose.Schema({
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
  salesInvoiceNumber: {
    type: String,
    required: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  DueDate: {
    type: Date,
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
  paymentStatus: {
    type: String,
    enumm: ['0', '1', '2'], // 0=notPaid | 1=paid | 2=partialPaid;
    default: '0'
  },
  dueAmount: {
    type: String
  },
  paymentAccount: {
    type: String
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

module.exports = mongoose.model("salesinvoice", salesInvoiceSchema);
