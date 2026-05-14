const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const { checkToken } = require('../middleware/auth');
const addressController = require('../controllers/address.controller')

router.post('/', checkToken, upload.none(), addressController.createAddress);
module.exports = router