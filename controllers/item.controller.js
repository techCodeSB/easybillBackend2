const { getId } = require("../helper/getIdFromToken");
const itemModel = require("../models/item.model");
const userModel = require("../models/user.model");
const purchaseInvoiceModel = require("../models/purchaseInvoice.model");


// Add controller;
const add = async (req, res) => {
  const { token, title, type, salePrice, category, details, update, id, unit, stock } = req.body;

  if ([token, title, salePrice, ].some(field => !field || field === "")) {
    return res.json({ err: 'require fields are empty', create: false });
  }

  if (!unit.length || unit.some(u => !u.unit || !u.conversion)) {
    return res.status(500).json({ err: 'Unit is required', create: false });
  }


  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo._id });

    const isExist = await itemModel.findOne({ title, companyId: getUserData.activeCompany, isDel: false });
    if (isExist && !update) {
      return res.status(500).json({ err: 'Item alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await itemModel.updateOne({ _id: id }, {
        $set: {
          title, type, salePrice, category: category || null, details, unit
        }
      })

      if (!update) {
        return res.status(500).json({ err: 'Item update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;


    let openingStock = [];
    let stockAlert = [];
    if (!update) {
      unit.forEach(u => {
        openingStock.push({
          unit: u.unit,
          stock: u.opening
        })

        stockAlert.push({
          unit: u.unit,
          alert: u.alert
        })
      })
    }

    const insert = await itemModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany,
      title, type, salePrice, category: category || null, details, unit, stock: openingStock, alert: stockAlert
    });

    if (!insert) {
      return res.status(500).json({ err: 'Item creation failed', create: false })
    }

    return res.status(200).json(insert);

  } catch (error) {
    console.log(error)
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
    const totalData = await itemModel.countDocuments({
      companyId: getUser.activeCompany,
      isTrash: trash ? true : false,
      isDel: false
    });

    let getData;
    if (id) {
      getData = await itemModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isTrash: false,
        isDel: false
      }).populate('category');
    }
    else if (trash) {
      getData = await itemModel.find({
        companyId: getUser.activeCompany,
        isTrash: trash ? true : false,
        isDel: false
      }).skip(skip).limit(limit).populate('category').sort({ _id: -1 });
    }
    else if (all) {
      getData = await itemModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).skip(skip).limit(limit).populate('category').sort({ _id: -1 });
    } 
    else if (search) {
      if (searchText.trim() !== "") {
        getData = await itemModel.find({
          title: { $regex: searchText.trim(), $options: "i" },
          companyId: getUser.activeCompany,
          isDel: false,
          isTrash: false
        }).sort({ _id: -1 }).select("_id title");
      }
    }
    else {
      getData = await itemModel.find({
        companyId: getUser.activeCompany,
        isTrash: false,
        isDel: false
      }).skip(skip).limit(limit).populate('category').sort({ _id: -1 });
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No item availble', get: false });
    }



    // inCress stock ==========================================================
    // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    // for (let i of getData) { // ittrate all data;
    //   let pTitle = i.title;
    //   let getPurchasebill = await purchaseInvoiceModel.find({});


    //   for (let p of getPurchasebill) { // ittrate purchase bill;
    //     const item = p.items;

    //     item.forEach((i, _) => { //ittrate bill items;


    //       const unit = i.unit;

    //       // identify current product
    //       if (i.itemName.trim() === pTitle.trim()) {

    //       } else {

    //       }

    //     })


    //   }

    // }





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
    return res.status(400).json({ err: "No valid ids provided", remove: false });
  }

  try {
    let updateQuery;
    if (trash) {
      updateQuery = { $set: { isTrash: true } };
    } else {
      updateQuery = { $set: { isDel: true } };
    }

    const removeData = await itemModel.updateMany(
      { _id: { $in: ids } },
      updateQuery
    );

    if (removeData.matchedCount === 0) {
      return res.status(404).json({ err: "No matching item found", remove: false });
    }

    return res.status(200).json({
      msg: trash
        ? "Item successfully trash"
        : "Item successfully delete",
      modifiedCount: removeData.modifiedCount,
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ err: "Something went wrong", remove: false });
  }
};


// Resoter from trash;
const restore = async (req, res) => {
  const { ids } = req.body;

  if (ids.length === 0) {
    return res.status(500).json({ err: 'require fields are empty', restore: false });
  }

  try {
    const restoreData = await itemModel.updateMany({ _id: { $in: ids } }, {
      $set: {
        isTrash: false
      }
    })

    if (restoreData.matchedCount === 0) {
      return res.status(404).json({ err: "No Item restore", restore: false });
    }

    return res.status(200).json({ msg: 'Restore successfully', restore: true })

  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", restore: false });
  }

}

module.exports = {
  add, get, remove, restore
};
