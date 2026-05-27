const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')
const productController = require('../controllers/product.controller')
const { checkToken } = require('../middleware/auth')

router.post('/', checkToken, upload.single('image'), productController.createProduct);
router.put('/:id', checkToken, upload.single('image'), productController.updateProduct);
router.get('/', productController.getProduct);
router.get('/brands', productController.getBrands);
router.get('/categories', productController.getCategory);
router.get('/:id', productController.showProduct);
router.delete('/:id', checkToken, productController.deleteProduct);

module.exports = router