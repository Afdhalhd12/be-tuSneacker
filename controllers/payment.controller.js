const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Payment } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");

module.exports = {
    createPayment: async (req, res) => {
        try {
            const { paymentName } = req.body;

            const schema = {
                paymentName : { type: "string" },
            }

            const data = {
                paymentName : paymentName
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // Jika hasil vaalidate ada error
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const payment = await Payment.create(data);
            return res.status(201).json(response(201, "Success", payment));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    getPayments: async (req, res) => {
        try {
            const payment = await Payment.findAll();

            return res.status(200).json(response(200, "success", payment));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}