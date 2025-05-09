const mongoose = require('mongoose');

const partyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party',
    required: true,
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  invoiceModel: {
    type: String,
    required: true,
    enum: [
      'creditnote', 'debitnote', 'deliverychalan',  'paymentin', 'paymentout', 'purchaseorder', 'proforma',
      'purchaseinvoice', 'purchasereturn', 'quotation', 'salesinvoice', 'salesreturn'
    ], 
  },
  type: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
  },
}, {
  timestamps: true,
});


partyLogSchema.path('invoiceId').options.refPath = 'invoiceModel'; // Dynamic reference
const PartyLog = mongoose.model('PartyLog', partyLogSchema);
module.exports = PartyLog;

