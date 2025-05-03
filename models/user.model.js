const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
  },
  filename: {
    type: String
  },
  companies: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Company"
  },
  activeCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },
  isDel: {
    type: Boolean,
    default: false
  },
  forgotOtp: {
    type: String,
    default: null
  }

}, { timestamps: true });


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
