const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')

const userController = require('../controllers/user.controller');
const { checkToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/isAdmin');

//tidak menggunakan prefix karena nanti akan berbeda, tidak pake prefix karena nanti login dan logout akan beda
router.post('/signup', upload.none(), userController.signUp);
router.post('/login', upload.none(), userController.login);
router.get('/getuser', upload.none(), userController.getUser);
router.get('/showuser/:id', isAdmin, upload.none(), userController.showUser);
router.delete('/getuser/:id', upload.none(), userController.deleteUser);
router.put('/updateuser/:id', isAdmin, checkToken, upload.single('photoProfile'), userController.updateUserByAdmin);
router.put('/updateuser', checkToken, upload.single('photoProfile'), userController.updateUser);
router.get('/me', checkToken, upload.single('photoProfile'), userController.getProfile);



module.exports = router