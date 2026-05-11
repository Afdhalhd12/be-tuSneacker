const jwt = require('jsonwebtoken')
const { response } = require('../helpers/response.formatter')
const { auth_secret } = require('../config/base.config')

module.exports = {
    checkToken: async (req, res, next) => {
        // token diambil dari header
        const token = req.header("Authorization");
        if (!token) {
            // 401 : err untuk pengguna yang belum login (unauthorized)
            return res.status(401).json(response(401, "unauthorized", "Please Login and try again!"));
        }

        try {
            // cekk token apakah aktif atau sudh expired
            const check = jwt.verify(token, auth_secret);
            // karena nanti pengguna perlu data identitas pengguna (userId atau yang lain), panggil patload yang dikirim jwt.sign() di logincontroller . data payload tersimpan di const check (hasil verify), data payload yang di jwt.sign (userId, name, email)

            next(); //lanjutkan proses routing yang disimpan
            req.user = check;
        } catch (error) {
            // jika terjadi error, ini hubungannya dengan token, jadi kasi 401 (suruh login lagi)
            return res.status(401).json(response(401, "Server Error", "Please login and try again!"))
        }
    }
}