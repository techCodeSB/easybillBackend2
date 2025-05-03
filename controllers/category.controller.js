const { getId } = require("../helper/getIdFromToken");
const categoryModel = require("../models/category.model");
const userModel = require("../models/user.model");

const add = async (req, res) => {
  const { title, tax, hsn, type, details, token, update, id } = req.body;

  if ([token, title, tax, type].some((field) => !field || field === "")) {
    return res.json({ err: 'require fields are empty', create: false });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await categoryModel.findOne({ title, companyId: getUserData.activeCompany, isDel: false });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Category alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await categoryModel.updateOne({ _id: id }, {
        $set: {
          title, tax, hsn, type, details
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Category update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await categoryModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      title, tax, hsn, type, details,
    });

    if (!insert) {
      return res.status(500).json({ err: 'Category creation failed', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
  }
}


// get Controller
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

    const totalData = await categoryModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await categoryModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      })
    }
    else if (trash) {
      getData = await categoryModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit);
    }
    else if (all) {
      getData = await categoryModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit)
    }
    else if (search) {
      if (searchText.trim() !== "") {
        getData = await categoryModel.find({
          title: { $regex: searchText.trim(), $options: "i" },
          companyId: getUser.activeCompany,
          isDel: false,
          isTrash: false
        }).sort({ _id: -1 }).select("_id title");
      }
    }
    else {
      getData = await categoryModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).populate('tax').sort({ _id: -1 });
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No category availble', get: false });
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

    const removeData = await categoryModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeData.matchedCount === 0) {
      return res.status(404).json({ err: "No matching category found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Category successfully trash"
        : "Category successfully delete",
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
    const restoreData = await categoryModel.updateMany({ _id: { $in: ids } }, {
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
