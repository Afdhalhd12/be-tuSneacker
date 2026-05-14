const express = require('express')
const app = express()
const port = 3000

const db = require("./models")
const methodOverride = require('method-override')
const userRoutes = require('./routes/user.routes')
const productRoutes = require('./routes/product.routes')
const sizeRoutes = require('./routes/size.routes')
const productSizeRoutes = require('./routes/productSize.routes')
const paymentRoutes = require('./routes/payment.routes')
const addressRoutes = require('./routes/address.routes')
const {checkToken} = require('./middleware/auth')

//cek koneki model - migration - proyek sequelize
db.sequelize.authenticate()
  .then(() => console.log("Database (model) terkoneksi"))
  .catch((error) => console.error(error))

// app.use : mendaftarkan routing atau config header lain, urutannya sblm, app.get
app.use(express.json()); //mengijinkan req.body format json
app.use(methodOverride("_method")); //menggunakan method put, delete, patch
app.use('/', userRoutes); //mendaftarkan routes dab prefix nya
app.use('/product', productRoutes); //mendaftarkan routes dab prefix nya
app.use('/size', sizeRoutes); //mendaftarkan routes dab prefix nya
app.use('/productsize', productSizeRoutes); //mendaftarkan routes dab prefix nya
app.use('/payment', paymentRoutes); //mendaftarkan routes dab prefix nya
app.use('/address', addressRoutes); //mendaftarkan routes dab prefix nya

app.get('/', (req, res) => {
  res.send('Hello')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
