const transactionModel = require("../models/transaction.model");
const { getId } = require("../helper/getIdFromToken");
const userModel = require("../models/user.model");


const add = async (req, res) => {
  const { token, transactionType, purpose, transactionNumber, transactionDate, paymentMode,
    account, amount, note, update, id
  } = req.body;

  if ([token, transactionType, purpose, transactionNumber, transactionDate, paymentMode,
    account, amount]
    .some((field) => field === "")) {
    return res.status(400).json({ msg: "Fill the blank" });
  }


  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await transactionModel.findOne({
      userId: getInfo._id, companyId: getUserData.activeCompany, transactionNumber, isDel: false
    });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Transaction alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await transactionModel.updateOne({ _id: id }, {
        $set: {
          transactionType, purpose, transactionNumber, transactionDate, paymentMode,
          account, amount, note
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Transaction update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await transactionModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      transactionType, purpose, transactionNumber, transactionDate, paymentMode,
      account, amount, note
    });

    if (!insert) {
      return res.status(500).json({ err: 'Trasaction creation failed', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
  }


}


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
    const totalData = await transactionModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;

    if (id) {
      getData = await transactionModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      });
    }
    else if (trash) {
      getData = await transactionModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate("account");
    }
    else if (all) {
      getData = await transactionModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate("account");
    }
    else {
      getData = await transactionModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 }).populate("account");
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No Transaction availble', get: false });
    }

    return res.status(200).json({ data: getData, totalData: totalData });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', get: false });
  }

}

// Delete controller
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

    const removeParty = await transactionModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeParty.matchedCount === 0) {
      return res.status(404).json({ err: "No matching Transaction found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Transaction added to trash successfully"
        : "Transaction deleted successfully",
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
    const restoreData = await transactionModel.updateMany({ _id: { $in: ids } }, {
      $set: {
        isTrash: false
      }
    })

    if (restoreData.matchedCount === 0) {
      return res.status(404).json({ err: "No transaction restore", restore: false });
    }

    return res.status(200).json({ msg: 'Restore successfully', restore: true })


  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", restore: false });
  }
}


module.exports = {
  add, get, remove, restore
}
