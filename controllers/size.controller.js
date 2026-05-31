const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Size } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");
const { type } = require("os");

module.exports = {
    createSize: async (req, res) => {
        try {
            const { sizeName } = req.body;
            const schema = {
                sizeName: { type: "number", positive: true, integer: true }
            }
            const data = {
                sizeName: Number(sizeName)
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // cek duplicate
            const existing = await Size.findOne({
                where: {
                    sizeName: data.sizeName,
                },
            });

            if (existing) {
                return res
                    .status(409)
                    .json(response(409, "Size already exists"));
            }

            const size = await Size.create(data);
            return res.status(201).json(response(201, 'Success', size));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    getSize: async (req, res) => {
        try {
            const size = await Size.findAll();

            return res.status(200).json(response(200, "Success", size));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}