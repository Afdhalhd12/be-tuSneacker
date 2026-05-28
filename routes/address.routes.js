const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const addressController = require('../controllers/address.controller')

router.post('/', upload.none(), addressController.createAddress);
router.get('/', upload.none(), addressController.getAddress);
module.exports = router