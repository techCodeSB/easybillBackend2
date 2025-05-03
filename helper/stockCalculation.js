const purchaseInvoiceModel = require("../models/purchaseInvoice.model");
const itemModel = require("../models/item.model");

const Stock = {
  getStock: async (id, company) => {
    const getPurchase = await purchaseInvoiceModel.findOne({ _id: id });
    const getAllPurchase = await purchaseInvoiceModel.find({ companyId: company, isDel: false, isTrash: false });
    


  
  }
}

module.exports = Stock;
