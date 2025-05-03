const path = require("path");
const fs = require('fs');


const removeFile = (p) => {
  fs.unlink(p, (err) => {
    if (err) {
      return false;
    }

    return true;
  })
}


module.exports = removeFile;
