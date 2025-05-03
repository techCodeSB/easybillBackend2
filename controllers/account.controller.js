const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");

const { getId } = require("../helper/getIdFromToken");
const paymentOutModel = require("../models/paymentout.model");
const paymentInModel = require("../models/paymentin.model");
const transactionModel = require("../models/transaction.model");


const add = async (req, res) => {
  const {
    token, title, holderName, accountNumber, ifscCode, bankName, openingBalance, type, details,
    update, id
  } = req.body;

  if ([title, type].some((field) => !field || field === "")) {
    return res.status(500).json({
      err: "require fields are empty", create: false
    });
  }

  const isExist = await accountModel.findOne({ title, isDel: false });
  if (isExist && !update) {
    return res.status(500).json({
      err: "Account alredy exist", create: false
    });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    // update code.....
    if (update && id) {
      const update = await accountModel.updateOne({ _id: id }, {
        $set: {
          title, holderName, accountNumber, ifscCode, bankName, openingBalance, type, details
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Account update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await accountModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      title, holderName, accountNumber, ifscCode, bankName, openingBalance, type, details
    });

    if (!insert) {
      return res.status(500).json({ err: "Account creation failed", create: false });
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log(error)
    return res.status(500).json({ err: "Something went wrong", create: false });
  }

}


// get Controller
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

    const totalData = await accountModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await accountModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      })
    }
    else if (trash) {
      getData = await accountModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit);
    }
    else if (all) {
      getData = await accountModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit)
    }
    else {
      getData = await accountModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit)
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No Account availble', get: false });
    }



    (async () => {
      for (let i = 0; i < getData.length; i++) {
        let amount = getData[i].openingBalance || 0;

        // Fetch payments for the account
        const paymentsOut = await paymentOutModel.find({ account: getData[i]._id, companyId: getUser.activeCompany, isTrash: false, isDel: false });
        const paymentsIn = await paymentInModel.find({ account: getData[i]._id, companyId: getUser.activeCompany, isTrash: false, isDel: false });
        const transactions = await transactionModel.find({ account: getData[i]._id, companyId: getUser.activeCompany, isTrash: false, isDel: false });


        // incress the payments
        paymentsIn.forEach(p => {
          amount += parseFloat(p.amount);
        });

        // decress the payments
        paymentsOut.forEach((p, _) => {
          amount -= parseFloat(p.amount)
        })

        // transaction
        transactions.forEach((t, _) => {
          if (t.transactionType === "income") {
            amount += parseFloat(t.amount);
          } else {
            amount -= parseFloat(t.amount);
          }
        })


        // Update the reference in the array
        getData[i]['openingBalance'] = amount;
      }

      return res.status(200).json({ data: getData, totalData: totalData });

    })();


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

    const removeData = await accountModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeData.matchedCount === 0) {
      return res.status(404).json({ err: "No matching category found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Account successfully trash"
        : "Account successfully delete",
      modifiedCount: removeData.modifiedCount,
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
    const restoreData = await accountModel.updateMany({ _id: { $in: ids } }, {
      $set: {
        isTrash: false
      }
    })

    if (restoreData.matchedCount === 0) {
      return res.status(404).json({ err: "No account restore", restore: false });
    }

    return res.status(200).json({ msg: 'Restore successfully', restore: true })


  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", restore: false });
  }
}

module.exports = { add, get, remove, restore };
