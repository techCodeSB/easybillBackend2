const { getId } = require("../helper/getIdFromToken");
const removeFile = require("../helper/removeFile");
const { saveBase64Image } = require("../helper/uploader");
const companyModel = require("../models/company.model");
const userModel = require("../models/user.model");
const path = require("path");



const add = async (req, res) => {
  const { token, name, phone, email, gst, pan, invoiceLogo, signature, logoFileName, signatureFileName,
    address, country, state, poInitial, invoiceInitial, proformaInitial, poNextCount,
    invoiceNextCount, proformaNextCount, quotationInitial, creditNoteInitial, deliverChalanInitial,
    salesReturnInitial, quotationCount, creditNoteCount, salesReturnCount, deliveryChalanCount,
    salesReminder, purchaseReminder, update, city, pin
  } = req.body;


  if ([token, name, phone, email, gst, pan,
    address, country, state].some((field) => !field || field == "")) {
    return res.json({ err: 'require fields are empty', update: false });
  }

  const checkExist = await companyModel.findOne({ gst });
  if (checkExist && !update) {
    return res.status(500).json({ err: "company alredy exist" });
  }

  try {
    const getUser = await getId(token);

    if (update) {
      const userData = await userModel.findOne({ _id: getUser._id })
      const updateData = {
        name, phone, email, gst, pan, address, country, state, poInitial, invoiceInitial,
        proformaInitial, poNextCount, invoiceNextCount, proformaNextCount,
        salesReminder, purchaseReminder, quotationInitial, creditNoteInitial,
        deliverChalanInitial, salesReturnInitial, quotationCount, creditNoteCount,
        salesReturnCount, deliveryChalanCount, city, pin
      }

      // file upload ------------
      if (invoiceLogo) {
        const logo = saveBase64Image(invoiceLogo);
        if (logo) {
          updateData.invoiceLogo = invoiceLogo;
          updateData.logoFileName = logo;
        }

      }
      if (signature) {
        const sign = saveBase64Image(signature);
        if (sign) {
          updateData.signature = signature;
          updateData.signatureFileName = sign;
        }
      }


      const data = await companyModel.findOne({ _id: userData.activeCompany });
      if (!invoiceLogo && data?.invoiceLogo) {
        removeFile(path.join(__dirname, `../uploads/${data.logoFileName}`));
        Object.assign(updateData, { logoFileName: null, invoiceLogo: null });
      }

      if (!signature && data?.signature) {
        removeFile(path.join(__dirname, `../uploads/${data.signatureFileName}`));
        Object.assign(updateData, { signatureFileName: null, signature: null });
      }
      // file upload close ---------------------


      const update = await companyModel.updateOne({ _id: userData.activeCompany }, {
        $set: updateData
      })

      if (!update) {
        return res.status(500).json({ err: "Company update failed", update: false })
      }


      return res.status(200).json({ msg: "Company update successfully", update: true })
    }
    // ---------------- update close ---------------------
    // :::::::::::::::::::::::::::::::::::::::::::::::::::




    // file upload 
    let logo, sign;
    if (invoiceLogo) {
      logo = saveBase64Image(invoiceLogo);
    }
    if (signature) {
      sign = saveBase64Image(signature);
    }

    const insert = await companyModel.create({
      userId: getUser._id,
      name, phone, email, gst, pan, invoiceLogo: invoiceLogo,
      signature: signature, logoFileName: logo, signatureFileName: sign,
      address, country, state, poInitial, invoiceInitial,
      proformaInitial, poNextCount, invoiceNextCount, proformaNextCount,
      salesReminder, purchaseReminder, quotationInitial, creditNoteInitial,
      deliverChalanInitial, salesReturnInitial, quotationCount, creditNoteCount,
      salesReturnCount, deliveryChalanCount, city, pin,
    });

    if (!insert) {
      return res.status(500).json({ err: "something went wrong", success: false })
    }
    await userModel.updateOne({ email: getUser.email }, {
      $push: {
        companies: insert._id
      }
    })

    return res.status(200).json(insert)

  } catch (error) {
    return res.status(500).json({ err: "something went wrong" + error, success: false })
  }

}


// Get Company controller;
const get = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(500).json({ err: 'require fields are empty' });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });
    const getCompany = await companyModel.findOne({ _id: getUser.activeCompany });

    return res.status(200).json(getCompany);

  } catch (error) {
    return res.status(500).json({ err: "something went wrong" + error, success: false })
  }
}

// Swich company controller
const switchCompany = async (req, res) => {
  const { token, companyId } = req.body;

  if (!token || !companyId) {
    return res.status(500).json({ err: "require the fields" });
  }

  try {
    const getInfo = await getId(token);

    // Change active Company id;
    const change = await userModel.updateOne({ _id: getInfo._id }, {
      $set: {
        activeCompany: companyId
      }
    });

    if (!change) {
      return res.status(500).json({ err: 'Company switch failed' });
    }

    return res.status(200).json({ msg: 'Successfully switch' });

  } catch (error) {
    return res.status(500).json({ err: "Something went wrong" })
  }

}



module.exports = {
  add, get, switchCompany
}
