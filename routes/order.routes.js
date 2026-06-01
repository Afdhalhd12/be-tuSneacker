const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const orderController = require('../controllers/order.controller');
const { checkToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

router.post('/', checkToken, upload.none(), orderController.createOrder);
router.get('/', checkToken, isAdmin, orderController.getOrdersNonPending);
router.get('/foruser', checkToken, orderController.getOrdersForUser);
router.post('/cart', checkToken, orderController.addToCart);
router.get('/cart', checkToken, orderController.getCart);
router.get('/cart', checkToken, orderController.getCart);
router.patch('/cart/qty', checkToken, orderController.updateQty);
router.get('/foruser/:id', checkToken, orderController.getDetailOrder);
router.patch('/cart/checkout', checkToken, upload.none(), orderController.checkoutCart);
router.patch('/paymentupdate/:id', checkToken, upload.none(), orderController.paymentUpdate);
module.exports = router