const router = require('express').Router()
const { add, get, remove, restore } = require("../controllers/transaction.controller")



router
  .route("/add")
  .post(add);

router
  .route('/get')
  .post(get);

router
  .route("/delete")
  .delete(remove);

router
  .route('/restore')
  .post(restore)



module.exports = router;
