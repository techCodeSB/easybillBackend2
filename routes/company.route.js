const router = require('express').Router();
const { add, switchCompany, get } = require('../controllers/company.controller');
const fileUploader = require('../helper/fileUploader');


router
    .route('/add')
    // .post(fileUploader([{ name: 'invoiceLogo' }, { name: 'signature' }]), add);
    .post(add);

router
    .route("/switch-company")
    .post(switchCompany);

router
    .route('/get')
    .post(get);



module.exports = router;
