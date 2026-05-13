const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const productSizeontroller = require('../controllers/productSize.controller')

router.post('/', upload.none(), productSizeontroller.createProductSize);

module.exports = router