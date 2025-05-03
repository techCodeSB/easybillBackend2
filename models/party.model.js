const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true
  },
  partyCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PartyCategory",
    defult: null
  },
  type: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
  },
  billingAddress: {
    type: String,
    required: true
  },
  pan: {
    type: String,
  },
  gst: {
    type: String,
  },
  billingCountry: {
    type: String,
  },
  billingState: {
    type: String,
  },
  shippingAddress: {
    type: String,
    required: true
  },
  shippingCountry: {
    type: String,
  },
  shippingState: {
    type: String,
  },
  openingBalance: {
    type: String,
    default: 0
  },
  creditLimit: {
    type: String,
    default: 0
  },
  creditPeriod: {
    type: String,
    default: 0
  },
  dob: {
    type: Date,
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


const partyModel = new mongoose.model("party", partySchema);
module.exports = partyModel;
