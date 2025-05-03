const { getId } = require('../helper/getIdFromToken');
const partyModel = require('../models/party.model');
const userModel = require('../models/user.model');



// Add controller;
const add = async (req, res) => {
  const { token, name, type, contactNumber, billingAddress, shippingAddress,  email,
    pan, gst, openingBalance, details, update, id, creditPeriod, creditLimit, dob, partyCategory
  } = req.body;

  if ([token, name, type, contactNumber, billingAddress]
    .some((field) => !field || field === "")) {
    return res.json({ err: 'require fields are empty', create: false });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isPartyExist = await partyModel.findOne({
      userId: getInfo._id, companyId: getUserData.activeCompany, name, isDel: false
    });
    if (isPartyExist && !update) {
      return res.status(500).json({ err: 'Party alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await partyModel.updateOne({ _id: id }, {
        $set: {
          name, type, contactNumber, billingAddress, email,
          pan, gst, openingBalance, details,
          shippingAddress,pan, gst, openingBalance, details, partyCategory: partyCategory || null, 
          shippingAddress, creditPeriod, creditLimit, dob

        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Party update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await partyModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      name, type, contactNumber, billingAddress, email,
      pan, gst, openingBalance, details,
      shippingAddress, pan, gst, openingBalance, details, partyCategory: partyCategory || null,
      shippingAddress, creditPeriod, creditLimit, dob
    });

    if (!insert) {
      return res.status(500).json({ err: 'Party creation failed', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
  }

}


// Get Controller;
const get = async (req, res) => {
  const { token, trash, id, all, search, searchText } = req.body;
  const { page, limit } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (!token) {
    return res.status(500).json({ 'err': 'Invalid user', get: false });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });
    const totalData = await partyModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });


    let getData;
    if (id) {
      getData = await partyModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      }).populate("partyCategory")
    }
    else if (trash) {
      getData = await partyModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }
    else if (all) {
      getData = await partyModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }
    else if (search) {
      if (searchText.trim() !== "") {
        getData = await partyModel.find({
          name: { $regex: searchText.trim(), $options: "i" },
          companyId: getUser.activeCompany,
          isDel: false,
          isTrash: false
        }).sort({ _id: -1 }).select("_id name");
      }
    }
    else {
      getData = await partyModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No party availble', get: false });
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

    const removeParty = await partyModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeParty.matchedCount === 0) {
      return res.status(404).json({ err: "No matching parties found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Parties added to trash successfully"
        : "Parties deleted successfully",
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
    const restoreData = await partyModel.updateMany({ _id: { $in: ids } }, {
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




module.exports = {
  add, get, remove, restore
}
