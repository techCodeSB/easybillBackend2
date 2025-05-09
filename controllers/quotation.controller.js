const { getId } = require('../helper/getIdFromToken');
const quotationModel = require('../models/quotation.model');
const userModel = require('../models/user.model');
const companyModel = require('../models/company.model');
const Log = require('../helper/insertLog');



const add = async (req, res) => {
  const {
    token, party, quotationNumber, estimateDate, validDate, items, discountType, discountAmount,
    discountPercentage, additionalCharge, note, terms, update, id, billStatus, finalAmount
  } = req.body;



  // Update only bill status :::::::::::::::;
  if (update && id && billStatus && Object.keys(req.body).length === 4) {
    console.log('Updating bill status only...');

    const updateResult = await quotationModel.updateOne(
      { _id: id },
      { $set: { billStatus } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ err: 'Bill status update failed' });
    }

    return res.status(200).json({ success: true, message: 'Bill status updated' });
  }



  if ([token, party, quotationNumber, estimateDate, items]
    .some(field => !field || field === '')) {
    return res.status(400).json({ err: 'fill the blank server' });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await quotationModel.findOne({
      userId: getInfo._id, companyId: getUserData.activeCompany, quotationNumber: quotationNumber,
      isDel: false
    });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Quotation already exist' })
    }



    // update code.....
    if (update && id) {
      const update = await quotationModel.updateOne({ _id: id }, {
        $set: {
          party, quotationNumber, estimateDate, validDate, items, billStatus,
          discountType, discountAmount, discountPercentage, additionalCharge, note, terms
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Quotation update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;


    let company = await companyModel.findOne({ _id: getUserData.activeCompany });
    const getInvPrefix = parseInt(company.quotationCount) + 1;
    await companyModel.updateOne({ _id: getUserData.activeCompany }, {
      $set: {
        quotationCount: getInvPrefix
      }
    })


    const insert = await quotationModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      party, quotationNumber, estimateDate, validDate, items, billStatus,
      discountType, discountAmount, discountPercentage, additionalCharge, note, terms
    });

    if (!insert) {
      return res.status(500).json({ err: 'Quotation creation failed' });
    }

 
    // insert party log;
    await Log.insertPartyLog(token, insert._id, party, "Quotation", finalAmount, '', 'quotation');


    return res.status(200).json(insert);

  } catch (err) {
    console.log(err)
    return res.status(500).json({ err: 'Something went wrong' });
  }

};


// Get Controller;
const get = async (req, res) => {
  const { token, trash, id, all } = req.body;
  const { page, limit } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!token) {
    return res.status(500).json({ 'err': 'Invalid user', get: false });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });
    const totalData = await quotationModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await quotationModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      }).populate("party");
    }
    else if (trash) {
      getData = await quotationModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }
    else if (all) {
      getData = await quotationModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }
    else {
      getData = await quotationModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate('party');
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No quotation availble', get: false });
    }


    // Change billStatus;
    if (Array.isArray(getData) && getData.length > 0) {
      for (let data of getData) {
        if (data.billStatus === "active" && data.validDate) {
          const currentDate = new Date();
          const validDate = new Date(data.validDate);

          if (currentDate.toISOString() > validDate.toISOString()) {
            await quotationModel.updateOne({ _id: data._id }, { $set: { billStatus: 'expire' } });
          }
        }
      }
    }


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

    const removeParty = await quotationModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeParty.matchedCount === 0) {
      return res.status(404).json({ err: "No matching parties found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Quotation added to trash successfully"
        : "Quotation deleted successfully",
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
    const restoreData = await quotationModel.updateMany({ _id: { $in: ids } }, {
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
    query['quotationNumber'] = billNo;
  }
  if (billDate) {
    query['estimateDate'] = billDate;
  }


  if (fromDate && toDate) {
    query["estimateDate"] = {
      $gte: new Date(fromDate),
      $lte: new Date(toDate)
    }
  } else if (fromDate) {
    query["estimateDate"] = {
      $gte: new Date(fromDate)
    }
  } else if (toDate) {
    query["estimateDate"] = {
      $lte: new Date(toDate)
    }
  }

  let totalData = await quotationModel.find({ ...query, isDel: false }).countDocuments();
  let allData = await quotationModel.find({ ...query, isDel: false })
    .skip(skip).limit(limit).sort({ _id: -1 }).populate('party');


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
    return res.status(500).json({ 'err': 'No quotation availble', get: false });
  }

  return res.status(200).json({ data: allData, totalData: totalData });

}


module.exports = {
  add, get, remove, restore, filter
}
