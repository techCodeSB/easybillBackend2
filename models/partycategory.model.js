const mongoose = require('mongoose');

const partyCategorySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
  isDel: {
    type: Boolean,
    default: false,
  },

}, {timestamps: true});

module.exports = mongoose.model('PartyCategory', partyCategorySchema);