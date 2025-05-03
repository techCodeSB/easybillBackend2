const taxModel = require("../models/tax.model");
const { getId } = require('../helper/getIdFromToken');
const userModel = require('../models/user.model');



const add = async (req, res) => {
  const { token, title, details, gst, cess, update, id } = req.body;

  if (!token || !title || !gst || !cess) {
    return res.status(500).json({ err: 'require fields are empty' });
  }


  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await taxModel.findOne({ title, companyId: getUserData.activeCompany, isDel: false});
    if (isExist && !update) {
      return res.status(500).json({ err: 'Tax alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await taxModel.updateOne({ _id: id }, {
        $set: {
          title, details, gst, cess
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Tax update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await taxModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      title, details, gst, cess
    });

    if (!insert) {
      return res.status(500).json({ err: 'Tax creation failed', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
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
    const totalData = await taxModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await taxModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      })
    }
    else if (trash) {
      getData = await taxModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }
    else if (all) {
      getData = await taxModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }
    else {
      getData = await taxModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({ _id: -1 });
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No tax availble', get: false });
    }

    return res.status(200).json({ data: getData, totalData: totalData });

  } catch (error) {
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

    const removeData = await taxModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeData.matchedCount === 0) {
      return res.status(404).json({ err: "No matching tax found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Tax successfully trash"
        : "Tax successfully delete",
      modifiedCount: removeData.modifiedCount,
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ err: "Something went wrong", remove: false });
  }
  
}


// Resoter from trash;
const restore = async (req, res) => {
  const { ids } = req.body;

  if (ids.length === 0) {
    return res.status(500).json({ err: 'require fields are empty', restore: false });
  }

  try {
    const restoreData = await taxModel.updateMany({ _id: { $in: ids } }, {
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