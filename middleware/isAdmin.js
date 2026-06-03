const { response } = require('../helpers/response.formatter')
module.exports = {
    isAdmin: async (req, res, next) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json(
                response(403, "Forbidden", "Access denied")
            )
        }
        next();
    }
}

// const isAdmin = (req, res, next) => {
//     // Buat ngecek kalau bukan admin dia dilarang akses

// }

// module.exports = {
//     isAdmin
// }