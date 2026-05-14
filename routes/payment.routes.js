const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const paymentController = require('../controllers/payment.controller')

router.post('/', upload.none(), paymentController.createPayment);
module.exports = router