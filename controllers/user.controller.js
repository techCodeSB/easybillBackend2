const { getId } = require('../helper/getIdFromToken');
const userModel = require('../models/user.model');
const removeFile = require('../helper/removeFile')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require('path');
const { saveBase64Image } = require('../helper/uploader');
const jwt_key = process.env.JWT_SECRET;
const { Resend } = require("resend");
const nodemailer = require('nodemailer');
const mailModel = require('../models/mail.model');





// Register Controller
const addUser = async (req, res) => {
  const { name, email, password, profile, filename, update, token } = req.body;

  if ([name, email, password].some((field) => !field || field == "")) {
    return res.json({ 'err': 'require fields are empty' });
  }

  try {
    // profile update
    if (update && token) {
      const getInfo = await getId(token);
      const get = await userModel.findOne({ _id: getInfo._id });
      const checkPass = await bcrypt.compare(password, get.password);

      if (!checkPass) {
        return res.status(500).json({ err: "Invalid password" })
      }

      let updateData = { name, email };


      if (profile) {
        const file = saveBase64Image(profile); // if file upload return filename else return null; 
        if (file !== null) {
          updateData.filename = file;
          updateData.profile = profile;
        }
      } else {
        const data = await userModel.findOne({ _id: getInfo._id });
        if (data.profile) {
          removeFile(path.join(__dirname, `../uploads/${data.filename}`));
          updateData.filename = null;
          updateData.profile = null;
        }
      }


      let userUpdate = await userModel.updateOne({ _id: getInfo._id }, { $set: updateData });

      if (!userUpdate) {
        return res.status(500).json({ err: "Profile not update" })
      }

      return res.status(200).json({ msg: "Update successfully" })
    }

    // user add
    const isExistsEmail = await userModel.findOne({ email });
    if (isExistsEmail) {
      return res.json({ 'err': 'user alredy exist', register: false });
    }

    const insert = await userModel.create({
      name, email, password, profile
    })

    if (!insert) {
      return res.status(500).json({ 'err': 'Register failed', register: false });
    }

    return res.status(200).json({ 'success': 'Register success', register: true });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong' });
  }

}


// Get user Controller
const getUser = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(500).json({ err: 'require fields are empty' });
  }

  try {
    const userEmail = await getId(token);

    if (!userEmail.email || userEmail.email === null) {
      return res.status(500).json({ 'err': 'invalid token', data: false });
    }

    const userData = await userModel.findOne({ email: userEmail.email, isDel: false })
      .select("-password")
      .populate('companies');

    return res.status(200).json(userData);

  } catch (error) {
    return res.status(500).json({ 'err': 'Something went wrong', data: false });
  }
}


// Login Controller;
const login = async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => !field || field === "")) {
    return res.status(200).json({ 'err': 'require fields are empty', login: false });
  }

  try {
    const user = await userModel.findOne({ email, isDel: false }).select("-profile");
    if (!user) {
      return res.status(500).json({ err: 'Invalid login id or password', login: false })
    }

    const verifyPass = await bcrypt.compare(password, user.password);
    if (!verifyPass) {
      return res.status(500).json({ err: 'Invalid login id or password', login: false })
    }


    // Create token    
    const token = jwt.sign(JSON.stringify(user), jwt_key)
    return res.status(200).json({ token: token, login: true });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', login: false });
  }

}

// Change password controller
const updatepass = async (req, res) => {
  const { currentPassword, newPassword, token } = req.body;
  if ([currentPassword, newPassword, token].some((field) => !field || field == "")) {
    return res.status(200).json({ 'err': 'require fields are empty', change: false });
  }

  try {
    const getInfo = await getId(token);
    const getUser = await userModel.findOne({ _id: getInfo._id });

    const checkPass = await bcrypt.compare(currentPassword, getUser.password);
    if (!checkPass) {
      return res.status(500).json({ err: 'Invalid password' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(newPassword, salt);

    const update = await userModel.updateOne({ _id: getInfo._id }, {
      $set: {
        password: hashPass
      }
    });
    if (!update) {
      return res.status(500).json({ err: 'Update failed' });
    }

    return res.status(200).json({ msg: 'Update successfully' });


  } catch (error) {
    return res.status(500).json({ 'err': 'Something went wrong', change: false });
  }

}



// RESEND-API-KEY = re_L8y4DSVS_GqE1a8ooYY46CAzH8VJJdQ8B
const forgot = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(200).json({ 'err': 'require fields are empty', forgot: false });
  }

  try {
    const user = await userModel
      .findOne({ email, isDel: false })
      .select('-password');

    if (!user) {
      return res.status(500).json({ err: 'Invalid email', forgot: false });
    }

    let OTP = "";
    for (let i = 0; i < 4; i++) {
      OTP += Math.floor(Math.random() * 10);
    }


    await userModel.updateOne({ email }, { $set: { forgotOtp: OTP } });
    const token = jwt.sign(JSON.stringify({ email }), "adfa;3kw3254543=-2=34hnas3");

    const resend = new Resend('re_L8y4DSVS_GqE1a8ooYY46CAzH8VJJdQ8B');


    const emailSend = await resend.emails.send({
      from: 'Easybill <onboarding@resend.dev>',
      to: [email],
      subject: 'Forgot Easybill Password',
      html: `<p>Your EasyBil OTP is <b>${OTP}</b></p>`,
    });


    if (!emailSend) {
      return res.status(500).json({ err: 'Email not send', forgot: false });
    }

    return res.status(200).json({ msg: 'Email send successfully', forgot: true, token });

  } catch (error) {
    return res.status(500).json({ 'err': 'Something went wrong', forgot: false });
  }


}



const verifyOtp = async (req, res) => {
  const { otp, token } = req.body;

  if (!otp || !token) {
    return res.status(200).json({ 'err': 'require fields are empty', forgot: false });
  }

  try {

    const chekToken = jwt.verify(token, "adfa;3kw3254543=-2=34hnas3");
    if (!chekToken) {
      return res.status(500).json({ err: 'Invalid token', forgot: false });
    }

    const user = await userModel
      .findOne({ forgotOtp: otp, email: chekToken.email })
      .select('-password');

    if (!user) {
      return res.status(500).json({ err: 'Invalid OTP', forgot: false });
    }


    return res.status(200).json({ msg: 'OTP verified successfully', forgot: true });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', forgot: false });
  }
}



const changePassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(200).json({ 'err': 'require fields are empty', change: false });
  }

  try {
    const chekToken = jwt.verify(token, "adfa;3kw3254543=-2=34hnas3");
    if (!chekToken) {
      return res.status(500).json({ err: 'Invalid token', change: false });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const update = await userModel.updateOne({ email: chekToken.email }, {
      $set: {
        password: hashPass,
        forgotOtp: null
      }
    });


    if (!update) {
      return res.status(500).json({ err: 'Update failed', change: false });
    }

    const data = await userModel.findOne({ email: chekToken.email }).select('-password -profile');
    const newToken = jwt.sign(JSON.stringify(data), jwt_key)

    return res.status(200).json({ msg: 'Update successfully', change: true, newToken });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', change: false });
  }

}


const protectChangePassword = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(200).json({ 'err': 'require fields are empty', change: false });
  }

  try {
    const chekToken = jwt.verify(token, "adfa;3kw3254543=-2=34hnas3");
    if (!chekToken) {
      return res.status(500).json({ verify: false });
    }

    const data = await userModel.findOne({ email: chekToken.email })
    if (!data.forgotOtp) {
      return res.status(500).json({ verify: false });
    }

    return res.status(200).json({ verify: true });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ 'err': 'Something went wrong', verify: false });
  }
}



// Send bill via email
// :::::::::::::::::::
const sendBill = async (req, res) => {
  const { token, email, data, subject, body } = req.body;


  if (!token || !email || !data) {
    return res.status(200).json({ 'err': 'require fields are empty', send: false });
  }


  const checkToken = jwt.verify(token, jwt_key);

  if (!checkToken) {
    return res.status(500).json({ err: 'Invalid token', send: false });
  }

  const getInfo = await getId(token);
  const getUser = await userModel.findOne({ _id: getInfo?._id });


  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Use 465 for SSL, 587 for TLS
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER_NAME,
      pass: process.env.SMTP_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: `"${checkToken.email}" <easybill@gmail.com>`,
    to: email,
    subject: subject,
    // text: 'This is a plain text email body',
    html: `<div>${body}</div>`,
    attachments: [
      {
        filename: 'document.pdf',
        content: data,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ]
  };


  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      return res.status(500).json({ err: 'Email not send', send: false });
    } else {

      // store history;
      await mailModel.create({
        userId: getUser._id,
        companyId: getUser.activeCompany,
        to: email,
        billNo: '120'
      })

      return res.status(200).json({ msg: 'Email send successfully', send: true });
    }
  });


}


module.exports = {
  addUser, login, getUser, updatepass, forgot,
  verifyOtp, changePassword, protectChangePassword, sendBill
}
