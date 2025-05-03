const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ err: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ err: 'Token is not valid' });
  }
}

const verifiToken = (req, res) => {
  const token = req.body.token;
  if (!token) {
    return res.status(401).json({ err: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.status(200).json({ msg: 'Token is valid' });
  } catch (error) {
    res.status(500).json({ err: 'Token is not valid' });
  }
}


module.exports = { auth, verifiToken };
