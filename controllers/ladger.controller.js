const { getId } = require("../helper/getIdFromToken");
const ladgerModel = require("../models/ladger.model");
const userModel = require("../models/user.model");



// This Add Controller not used for API calling;
// ============================================
const addLadger = async (token, voucher, credit, debit, transactionNo, partyId) => {
  if ([token, voucher, credit, debit, transactionNo].some((field) => !field || field === "")) {
    return false;
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    // insert ladger
    const insert = await ladgerModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      voucher, credit, debit, transactionNo, partyId
    })

    if (!insert) {
      return false;
    }

    return true;

  } catch (error) {
    return false;
  }

}




const get = async (req, res) => {
  const { token, partyId } = req.body;

  if (!token || !partyId) {
    res.status(500).json({ err: "invalid user" })
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });

    const getLadger = await ladgerModel.find({
      partyId, companyId: getUser.activeCompany,
      userId: getInfo._id
    })

    if (!getLadger) {
      return res.status(500).json({ err: "No Ladger Found" })
    }


    return res.status(200).json(getLadger);

  } catch (error) {
    console.log("Ladger Error: ", error);
    res.status(500).json({ err: "Something went wrong" });
  }

}




module.exports = {
  addLadger, get, filter
}
