const partyModel = require("../models/partylog.model");
const userModel = require("../models/user.model");
const { getId } = require("./getIdFromToken");


const Log = {
  insertPartyLog: async (token, invoiceId, partyId, type, amount, status, model) => {

    if ([token, invoiceId, partyId, type, amount].some((field) => !field || field === "")) {
      return false;
    }

    try {
      const getInfo = await getId(token);
      const getUser = await userModel.findOne({ _id: getInfo._id });

      const insert = await partyModel.create({
        invoiceId, partyId, type, amount, status, companyId: getUser.activeCompany, userId: getInfo._id,
        invoiceModel: model
      });

      if (!insert) {
        return false;
      }

      return true;

    } catch (error) {
      console.log("from insertLog:", error);
      return false;
    }
  }


}

module.exports = Log;
