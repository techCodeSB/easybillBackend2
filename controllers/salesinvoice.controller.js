const { getId } = require('../helper/getIdFromToken');
const salesInvoiceModel = require('../models/salesinvoice.model');
const userModel = require('../models/user.model');
const paymentinModel = require("../models/paymentin.model");
const companyModel = require("../models/company.model");



// Create and Save a new Quotation;
const add = async (req, res) => {
  const {
    token, party, salesInvoiceNumber, invoiceDate, DueDate, items, discountType,
    discountAmount, discountPercentage, additionalCharge, note, terms, update, id, paymentStatus,
    paymentAccount, finalAmount, paymentAmount
  } = req.body;



  if ([token, party, salesInvoiceNumber, invoiceDate, items]
    .some(field => !field || field === '')) {
    return res.status(400).json({ err: 'fill the blank' });
  }

  let payStatus = paymentStatus;
  if (parseInt(finalAmount) === parseInt(paymentAmount)) {
    payStatus = "1" // full paid

  } else if (paymentAmount < finalAmount && paymentAmount > 0) {
    payStatus = "2" // partial paid

  } else if (paymentAmount === 0 || !paymentAmount) {
    payStatus = "0" // unpaid
  }


  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await salesInvoiceModel.findOne({
      userId: getInfo._id, companyId: getUserData.activeCompany, salesInvoiceNumber: salesInvoiceNumber,
      isDel: false
    });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Invoice already exist' })
    }



    if (paymentStatus === "1") {
      await paymentinModel.create({
        userId: getUserData._id, companyId: getUserData.activeCompany,
        party, paymentInNumber: salesInvoiceNumber, paymentInDate: invoiceDate,
        amount: paymentAmount, account: paymentAccount
      })

    }

    // update code.....
    if (update && id) {
      const update = await salesInvoiceModel.updateOne({ _id: id }, {
        $set: {
          party, salesInvoiceNumber, invoiceDate, DueDate, items,
          discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
          paymentStatus: payStatus, paymentAccount, dueAmount: (finalAmount - paymentAmount)
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Invoice update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;


    let company = await companyModel.findOne({ _id: getUserData.activeCompany });
    const getInvPrefix = parseInt(company.invoiceNextCount) + 1;
    await companyModel.updateOne({ _id: getUserData.activeCompany }, {
      $set: {
        invoiceNextCount: getInvPrefix
      }
    })


    const insert = await salesInvoiceModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      party, salesInvoiceNumber, invoiceDate, DueDate, items,
      discountType, discountAmount, discountPercentage, additionalCharge, note, terms,
      paymentStatus: payStatus, paymentAccount, dueAmount: (finalAmount - paymentAmount)
    });



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
    const totalData = await salesInvoiceModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    // paymentin ::::::::::::::::::::::::::::::::::::
    let totalPaymentAmount = 0;
    let totalDueAmount = 0;

    const paymentIn = await paymentinModel.find({
      companyId: getUser.activeCompany,
      isDel: false
    }).sort({ _id: -1 }).select('amount -_id');

    if (paymentIn.length > 0) {
      paymentIn.map((d, i) => {
        totalPaymentAmount += parseFloat(d.amount);
      })
    }



    let getData;
    if (id) {
      getData = await salesInvoiceModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      }).populate("party");
    }
    else if (trash) {
      getData = await salesInvoiceModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }
    else if (all) {
      getData = await salesInvoiceModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }
    else if (invoice) {
      getData = await salesInvoiceModel.find({
        companyId: getUser.activeCompany,
        party: party || null,
        isDel: false,
        isTrash: false,
        paymentStatus: { $ne: "1" } 
      }).sort({ _id: -1 });
    }
    else {
      getData = await salesInvoiceModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No Invoice availble', get: false });
    }


    if (getData?.length > 0) {
      getData.map((d, i) => {
        if(typeof d.dueAmount === 'string' && isNaN(parseInt(d.dueAmount)) === false) {
          totalDueAmount += parseFloat(d.dueAmount);
        }
      })
    }

    
    return res.status(200).json({ data: getData, totalData: totalData, totalPaymentAmount, totalDueAmount });

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

    const removeParty = await salesInvoiceModel.updateMany(
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
    const restoreData = await salesInvoiceModel.updateMany({ _id: { $in: ids } }, {
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
    query['salesInvoiceNumber'] = billNo
  }
  if (billDate) {
    query['invoiceDate'] = billDate;
  }


  if (fromDate && toDate) {
    console.log(`fromDate ${fromDate}\ntoDate ${toDate}`)
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

  let totalData = await salesInvoiceModel.find({ ...query, isDel: false }).countDocuments();
  let allData = await salesInvoiceModel.find({ ...query, isDel: false }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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

