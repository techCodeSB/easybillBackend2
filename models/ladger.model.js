const mongoose = require('mongoose');

const ladgerSchema = new mongoose.Schema({
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
  partyId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  date:{
    type: Date,
    default: new Date().toLocaleDateString(),
    required: true
  },
  voucher: {
    type: String,
    required: true
  },
  transactionNo:{
    type: String,
    required: true
  },
  credit: {
    type: String,
    required: true
  },
  debit: {
    type: String,
    required: true
  }

}, {timestamps: true});


const ladgerModel = new mongoose.model("ladger", ladgerSchema);
module.exports = ladgerModel;
