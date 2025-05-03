const mongoose = require("mongoose");
const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String, required: true
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  gst: {
    type: String
  },
  pan: {
    type: String
  },
  invoiceLogo: {
    type: String
  },
  signature: {
    type: String
  },
  address: {
    type: String
  },
  country: {
    type: String
  },
  state: {
    type: String
  },
  city: {
    type: String
  },
  pin: {
    type: String
  },
  poInitial: {
    type: String
  },
  invoiceInitial: {
    type: String
  },
  proformaInitial: {
    type: String
  },
  poNextCount: {
    type: String
  },
  invoiceNextCount: {
    type: String
  },
  proformaNextCount: {
    type: String
  },
  quotationInitial: {
    type: String
  },
  creditNoteInitial: {
    type: String
  },
  deliverChalanInitial: {
    type: String
  },
  salesReturnInitial: {
    type: String
  },
  quotationCount: {
    type: String
  },
  creditNoteCount: {
    type: String
  },
  salesReturnCount: {
    type: String
  },
  deliveryChalanCount: {
    type: String
  },
  salesReminder: {
    type: String
  },
  purchaseReminder: {
    type: String
  },
  logoFileName: {
    type: String
  },
  signatureFileName: {
    type: String
  },

}, {timestamps: true});

module.exports = mongoose.model("Company", companySchema);