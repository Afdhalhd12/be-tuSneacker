const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const { checkToken } = require('../middleware/auth');
const orderController = require('../controllers/order.controller')

router.post('/', checkToken, upload.none(), orderController.createOrder);
router.put('/paymentupdate/:id', checkToken, upload.none(), orderController.paymentUpdate);
module.exports = router