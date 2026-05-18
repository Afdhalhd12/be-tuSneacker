const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const orderController = require('../controllers/order.controller')

router.post('/', upload.none(), orderController.createOrder);
router.put('/paymentupdate/:id', upload.none(), orderController.paymentUpdate);
module.exports = router