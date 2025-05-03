const mongoose = require('mongoose');

const PaymentOutSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party',
    required: true
  },
  paymentOutNumber: {
    type: String,
    required: true
  },
  paymentOutDate: {
    type: Date,
    required: true
  },
  paymentMode: {
    type: String,
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
  },
  amount: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  isTrash: {
    type: Boolean,
    default: false
  },
  isDel: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model('paymentout', PaymentOutSchema);
