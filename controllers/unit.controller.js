const unitModel = require("../models/unit.model");
const { getId } = require('../helper/getIdFromToken');
const userModel = require('../models/user.model');


const add = async (req, res) => {
  const { token, title, details, update, id } = req.body;

  if (!token || !title) {
    return res.status(500).json({ err: 'require fields are empty' });
  }


  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await unitModel.findOne({ title, companyId: getUserData.activeCompany, isDel: false});
    if (isExist && !update) {
      return res.status(500).json({ err: 'Unit alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await unitModel.updateOne({ _id: id }, {
        $set: {
          title, details
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Unit update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await unitModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany, title, details,
    });

    if (!insert) {
      return res.status(500).json({ err: 'Unit creation failed', create: false })
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
    const totalData = await unitModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await unitModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      })
    }
    else if (trash) {
      getData = await unitModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).sort({_id: -1});
    }
    else if (all) {
      getData = await unitModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).sort({_id: -1});
    }
    else{
      getData = await unitModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).sort({_id: -1});
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No unit availble', get: false });
    }

    return res.status(200).json({ data: getData, totalData: totalData });

  } catch (error) {
    return res.status(500).json({ 'err': 'Something went wrong', get: false });
  }

}


// Delete controller
const remove = async (req, res) => {
  const { ids, trash } = req.body;
  console.log(ids)

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ err: "No valid ids provided", remove: false });
  }

  try {
    let updateQuery;
    if (trash) {
      updateQuery = { $set: { isTrash: true } };
    } else {
      updateQuery = { $set: { isDel: true } };
    }

    const removeData = await unitModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeData.matchedCount === 0) {
      return res.status(404).json({ err: "No matching unit found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Unit successfully trash"
        : "Unit successfully delete",
      modifiedCount: removeData.modifiedCount,
    });

  } catch (error) {
    console.log(error)
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
    const restoreData = await unitModel.updateMany({ _id: { $in: ids } }, {
      $set: {
        isTrash: false
      }
    })

    if (restoreData.matchedCount === 0) {
      return res.status(404).json({ err: "No unit restore", restore: false });
    }

    return res.status(200).json({msg: 'Restore successfully', restore: true})

  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", restore: false });
  }

}



module.exports = {
  add, get, remove, restore
}
