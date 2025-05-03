const { getId } = require('../helper/getIdFromToken');
const partycategoryModel = require('../models/partycategory.model');
const userModel = require('../models/user.model');



const add = async (req, res) => {
  const { token, name, update, id } = req.body;

  if (!token || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const getInfo = await getId(token);
    const getUserData = await userModel.findOne({ _id: getInfo?._id });

    const isExist = await partycategoryModel.findOne({
      userId: getInfo?._id, companyId: getUserData.activeCompany, name, isDel: false
    });

    if (isExist && !update) {
      return res.status(500).json({ err: 'Party category alredy exist', create: false })
    }

    // update code.....
    if (update && id) {
      const update = await partycategoryModel.findByIdAndUpdate({ _id: id }, {
        $set: { name }
      })


      if (!update) {
        return res.status(500).json({ err: 'Party category update failed', update: false })
      }

      return res.status(200).json(update)

    } // Update close here;

    const insert = await partycategoryModel.create({
      userId: getUserData._id, companyId: getUserData.activeCompany, name
    });

    if (!insert) {
      return res.status(500).json({ err: 'Category creation failed', create: false })
    }

    return res.status(200).json(insert);


  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', create: false });
  }

}



// Get Controller;
const get = async (req, res) => {
  const { token, id, search, searchText } = req.body;


  if (!token) {
    return res.status(500).json({ 'err': 'Invalid user', get: false });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });

    let getData;
    if (id) {
      getData = await partycategoryModel.findOne({
        companyId: getUser.activeCompany,
        _id: id,
        isDel: false
      })
    }
    else if (search) {
      if (searchText.trim() !== "") {
        getData = await partycategoryModel.find({
          name: { $regex: searchText.trim(), $options: "i" },
          companyId: getUser.activeCompany,
          isDel: false,
        }).sort({ _id: -1 }).select("_id name");
      }
    }
    else {
      getData = await partycategoryModel.find({
        companyId: getUser.activeCompany,
        isDel: false
      }).sort({ _id: -1 });
    }

    if (!getData) {
      return res.status(500).json({ 'err': 'No party category availble', get: false });
    }

    return res.status(200).json(getData);

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', get: false });
  }

}


// Delete controller
const remove = async (req, res) => {
  const { token, id } = req.body;

  if (!id || !token) {
    return res.status(400).json({ err: "No valid id provided", remove: false });
  }

  const getInfo = await getId(token);
  if (!getInfo) {
    return res.status(500).json({ err: "Invalid user", remove: false });
  }

  try {
    const removeParty = await partycategoryModel.updateOne(
      { _id: id },
      { $set: { isDel: true } }
    );

    if (removeParty.matchedCount === 0) {
      return res.status(404).json({ err: "No matching parties found", remove: false });
    }

    return res.status(200).json({
      msg: "Party category deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({ err: "Something went wrong", remove: false });
  }

};



module.exports = {
  add, get, remove
}
