const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Address } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");

module.exports = {
    createAddress: async (req, res) => {
        try {
            const { addressLine, city, postalCode, notes } = req.body
            const schema = {
                addressLine: { type: "string" },
                city: { type: "string" },
                postalCode: { type: "string" },
                notes: { type: "string" },
            }

            const data = {

                addressLine: addressLine,
                city: city,
                postalCode: postalCode,
                notes: notes,
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // Jika hasil vaalidate ada error
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const address = await Address.create({
                addressLine: data.addressLine,
                city: data.city,
                postalCode: data.postalCode,
                notes: data.notes,
                user_id: req.user.userId,
            });

            return res.status(201).json(response(201, "created", address));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    }
}

