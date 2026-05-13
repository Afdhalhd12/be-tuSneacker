const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Product, ProductSize, Size } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");

module.exports = {
    createProductSize: async (req, res) => {
        try {
            const { product_id, size_id, stock } = req.body;

            const schema = {
                product_id: { type: "number", positive: true, integer: true },
                size_id: { type: "number", positive: true, integer: true },
                stock: { type: "number", positive: true, integer: true },
            }

            const data = {
                product_id: Number(product_id),
                size_id: Number(size_id),
                stock: Number(stock),
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi error", validate));
            }
            const productSize = await ProductSize.create(data);

            const result = await ProductSize.findByPk(productSize.id, { include: [Product, Size] });
            return res.status(201).json(response(201, "Success", result));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    updateProductSize: async (req, res) => {
        try {
            const { id } = req.params;
            const { stock } = req.body;

            const schema = {
                stock: { type: "number", positive: true, integer: true }
            }
            const data = {
                stock: Number(stock)
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi error", validate));
            }

            const productSize = await ProductSize.findByPk(id);
            if(!productSize){
                return res.status(400).json(response(404, "Product Size [id] not found"));
            }

            await ProductSize.update(data, {
                where: {id}
            });

            const result = await ProductSize.findByPk(productSize.id, { include: [Product, Size] });

            return res.status(200).json(response(200, "Success", result));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    }
}