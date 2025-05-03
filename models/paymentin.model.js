const mongoose = require('mongoose');

const PaymentInSchema = mongoose.Schema({
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
  paymentInNumber: {
    type: String,
    required: true
  },
  paymentInDate: {
    type: Date,
    required: true
  },
  paymentMode: {
    type: String
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account"
  },
  amount: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  invoiceId: {
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

module.exports = mongoose.model('paymentin', PaymentInSchema);
