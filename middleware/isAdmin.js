const { response } = require('../helpers/response.formatter')

const isAdmin = (req, res, next) => {
    // Buat ngecek kalau bukan admin dia dilarang akses
    if (req.user.role !== 'admin') {
        return res.status(403).json(
            response(403, "Forbidden", "Access denied")
        )
    }

    next()
}

module.exports = {
    isAdmin
}