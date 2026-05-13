const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const productController = require('../controllers/product.controller')

router.post('/', upload.single('image'), productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.get('/', productController.getProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router