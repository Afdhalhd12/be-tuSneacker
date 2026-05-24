const Validator = require("fastest-validator");
const v = new Validator();

const { Product, ProductSize, Size } = require("../models");
const { response } = require("../helpers/response.formatter");

module.exports = {
    createProductSize: async (req, res) => {
        try {
            const { product_id, size_id, stock } = req.body;

            const data = {
                product_id: Number(product_id),
                size_id: Number(size_id),
                stock: Number(stock),
            };

            const schema = {
                product_id: { type: "number", integer: true, positive: true },
                size_id: { type: "number", integer: true, positive: true },
                stock: { type: "number", integer: true, min: 0 },
            };

            const validate = v.validate(data, schema);

            if (validate.length > 0) {
                return res
                    .status(400)
                    .json(response(400, "Validation error", validate));
            }

            // cek product
            const product = await Product.findByPk(data.product_id);
            if (!product) {
                return res
                    .status(404)
                    .json(response(404, "Product not found"));
            }

            // cek size
            const size = await Size.findByPk(data.size_id);
            if (!size) {
                return res
                    .status(404)
                    .json(response(404, "Size not found"));
            }

            // cek duplicate
            const existing = await ProductSize.findOne({
                where: {
                    product_id: data.product_id,
                    size_id: data.size_id,
                },
            });

            if (existing) {
                return res
                    .status(409)
                    .json(response(409, "Product size already exists"));
            }

            const productSize = await ProductSize.create(data);

            const result = await ProductSize.findByPk(productSize.id, {
                include: [Product, Size],
            });

            return res
                .status(201)
                .json(response(201, "Product size created successfully", result));

        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json(response(500, "Internal Server Error"));
        }
    },

    updateProductSize: async (req, res) => {
        try {
            const { id } = req.params;
            const { stock } = req.body;

            const data = {
                stock: Number(stock),
            };

            const schema = {
                stock: { type: "number", integer: true, min: 0 },
            };

            const validate = v.validate(data, schema);

            if (validate.length > 0) {
                return res
                    .status(400)
                    .json(response(400, "Validation error", validate));
            }

            const productSize = await ProductSize.findByPk(id, {
                include: [Product, Size],
            });

            if (!productSize) {
                return res
                    .status(404)
                    .json(response(404, "Product size not found"));
            }

            await productSize.update(data);

            return res
                .status(200)
                .json(response(200, "Product size updated successfully", productSize));

        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json(response(500, "Internal Server Error"));
        }
    },
    
    getProductSizesByProductId: async (req, res) => {
        try {
            const { product_id } = req.params;

            const product = await Product.findByPk(product_id);

            if (!product) {
                return res
                    .status(404)
                    .json(response(404, "Product not found"));
            }

            const productSizes = await ProductSize.findAll({
                where: {
                    product_id: Number(product_id),
                },
                include: [Size],
            });

            return res
                .status(200)
                .json(response(200, "Product sizes fetched successfully", productSizes));

        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json(response(500, "Internal Server Error"));
        }
    },
};