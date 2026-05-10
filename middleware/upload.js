const multer = require("multer")
//path : agar bisa mengakses folder file project
const path = require("path")

//proses upload disimpan di middleware karena : middleware -> penghubunt (route - middleware - controller)
// sebelum file diakses di controller, oleh middleware di proses dulu agar siap digunakan

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // FIle yang di upload akan disimpan di folder project ini bagian upload
    cb(null, path.join(__dirname, "../uploads"))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // Ambil format file .jpg .png
    const ext = path .extname(file.originalname)
    // uniquesuffix isinya nama file random, ext isi nya jpg jadi perlu digabung
    //fieldname nama input dari formulir nya
    const name = file.fieldname + '-' + uniqueSuffix + ext
    cb(null, name )
  }
})

module.exports = multer({ storage: storage })