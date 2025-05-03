const jwt = require("jsonwebtoken");


const getId = (token) => {
  return new Promise((resolve, reject) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      resolve(decoded);
    } catch (err) {
      resolve(null);
    }
  })
}

module.exports = {
  getId
}
