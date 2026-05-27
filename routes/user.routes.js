const express = require('express')
const router = express.Router() //biar bisa bikin router di express
const upload = require('../middleware/upload')

const userController = require('../controllers/user.controller');
const { checkToken } = require('../middleware/auth');

//tidak menggunakan prefix karena nanti akan berbeda, tidak pake prefix karena nanti login dan logout akan beda
router.post('/signup', upload.none(), userController.signUp);
router.post('/login', upload.none(), userController.login);
router.get('/getuser', upload.none(), userController.getUser);
router.put('/updateuser/:id', checkToken, upload.single('photoProfile'),  userController.updateUser);



module.exports = router