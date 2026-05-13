const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const sizeController = require('../controllers/size.controller')

router.post('/', upload.none(), sizeController.createSize);

module.exports = router