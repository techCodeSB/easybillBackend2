const { getId } = require('../helper/getIdFromToken');
const purchaseInvoiceModel = require('../models/purchaseInvoice.model');
const userModel = require('../models/user.model');
const itemModel = require('../models/item.model');
const paymentoutModel = require('../models/paymentout.model');



// Create and Save a new Quotation;
const add = async (req, res) => {
  const {
    token, party, purchaseInvoiceNumber, originalInvoiceNumber, invoiceDate, validDate, items, discountType,
    discountAmount, discountPercentage, additionalCharge, note, terms, update, id,
    paymentStatus, finalAmount, paymentAccount
  } = req.body;

  if ([token, party, purchaseInvoiceNumber, invoiceDate, validDate, items, paymentStatus]
    .some(field => !field || field === '')) {
    return res.status(400).json({ err: 'fill the blank' });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await purchaseInvoiceModel.findOne({
      userId: getInfo._id, companyId: getUserData.activeCompany, purchaseInvoiceNumber: purchaseInvoiceNumber,
      isDel: false
    });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Invoice already exist' })
    }


    // update code.....
    if (update && id) {
      const update = await purchaseInvoiceModel.updateOne({ _id: id }, {
        $set: {
          party, purchaseInvoiceNumber, invoiceDate, validDate, items, originalInvoiceNumber,
          discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
          paymentStatus, paymentAccount
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Invoice update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await purchaseInvoiceModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      party, purchaseInvoiceNumber, originalInvoiceNumber, invoiceDate, validDate, items,
      discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
      paymentStatus, paymentAccount, dueAmount: finalAmount
    });


    // check payment
    if (paymentStatus === '1') {
      await paymentoutModel.create({
        userId: getUserData._id, companyId: getUserData.activeCompany,
        party, paymentOutNumber: purchaseInvoiceNumber, paymentOutDate: invoiceDate,
        amount: finalAmount, account: paymentAccount
      })

    }


    if (!insert) {
      return res.status(500).json({ err: 'Invoice creation failed' });
    }

    return res.status(200).json(insert);

  } catch (err) {
    console.log(err)
    return res.status(500).json({ err: 'Something went wrong' });
  }

};



// Get Controller;
const get = async (req, res) => {
  const { token, trash, id, all, invoice, party } = req.body;
  const { page, limit } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!token) {
    return res.status(500).json({ 'err': 'Invalid user', get: false });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });
    const totalData = await purchaseInvoiceModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await purchaseInvoiceModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      }).populate("party");
    }
    else if (trash) {
      getData = await purchaseInvoiceModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }
    else if (all) {
      getData = await purchaseInvoiceModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');

    }
    else if (invoice) {
      console.log("request--->", invoice, party)
      getData = await purchaseInvoiceModel.find({
        companyId: getUser.activeCompany,
        party: party || null,
        isDel: false,
        isTrash: false
      }).sort({ _id: -1 }).select('_id purchaseInvoiceNumber dueAmount');
    }
    else {
      getData = await purchaseInvoiceModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No Invoice availble', get: false });
    }

    console.log(getData)
    return res.status(200).json({ data: getData, totalData: totalData });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', get: false });
  }

}


// Delete controller;
const remove = async (req, res) => {
  const { ids, trash } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ err: "No valid IDs provided", remove: false });
  }

  try {
    let updateQuery;
    if (trash) {
      updateQuery = { $set: { isTrash: true } };
    } else {
      updateQuery = { $set: { isDel: true } };
    }

    const removeParty = await purchaseInvoiceModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeParty.matchedCount === 0) {
      return res.status(404).json({ err: "No matching parties found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Invoice added to trash successfully"
        : "Invoice deleted successfully",
      modifiedCount: removeParty.modifiedCount,
    });

  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", remove: false });
  }
};



// Resoter from trash
const restore = async (req, res) => {
  const { ids } = req.body;

  if (ids.length === 0) {
    return res.status(500).json({ err: 'require fields are empty', restore: false });
  }

  try {
    const restoreData = await purchaseInvoiceModel.updateMany({ _id: { $in: ids } }, {
      $set: {
        isTrash: false
      }
    })

    if (restoreData.matchedCount === 0) {
      return res.status(404).json({ err: "No tax restore", restore: false });
    }

    return res.status(200).json({ msg: 'Restore successfully', restore: true })


  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", restore: false });
  }
}


const filter = async (req, res) => {
  const {
    token, productName, fromDate, toDate, billNo, party, gst, billDate
  } = req.body;
  const { page, limit } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);


  if (!token) {
    return res.status(500).json({ 'err': 'Invalid user', get: false });
  }

  const getInfo = await getId(token);
  const getUser = await userModel.findOne({ _id: getInfo._id });

  const query = { companyId: getUser.activeCompany };
  if (productName) {
    query["items.itemName"] = productName
  }
  if (billNo) {
    query['purchaseInvoiceNumber'] = billNo
  }
  if (billDate) {
    query['invoiceDate'] = billDate;
  }


  if (fromDate && toDate) {
    console.log(`fromDate ${fromDate} \n toDate ${toDate}`)
    query["invoiceDate"] = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    }
  } else if (fromDate) {
    query["invoiceDate"] = {
      $gte: new Date(fromDate)
    }
  } else if (toDate) {
    query["invoiceDate"] = {
      $lte: new Date(toDate)
    }
  }

  let totalData = await purchaseInvoiceModel.find({...query, isDel: false}).countDocuments();
  let allData = await purchaseInvoiceModel.find({...query, isDel: false}).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


  if (party && gst) {
    allData = allData.filter((d, i) => d.party.name === party && d.party.gst === gst);
  }
  else if (party) {
    allData = allData.filter((d, i) => d.party.name === party);
  }
  else if (gst) {
    allData = allData.filter((d, i) => d.party.gst === gst);
  }


  if (!allData) {
    return res.status(500).json({ 'err': 'No proforma availble', get: false });
  }

  return res.status(200).json({ data: allData, totalData: totalData });

}



module.exports = {
  add, get, remove, restore, filter
}

