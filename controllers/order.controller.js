const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Product, Order, OrderItem, ProductSize, sequelize } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");

module.exports = {
    createOrder: async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            const { address_id, payment_id, items } = req.body;
            const userId = req.user.userId;

            const schema = {
                address_id: { type: "number", positive: true, integer: true },
                payment_id: { type: "number", positive: true, integer: true },
                items: { type: "array", min: 1 }
            };

            const data = {
                address_id: Number(address_id),
                payment_id: Number(payment_id),
                items
            };

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi error", validate));
            }

            let totalPrice = 0;
            let orderItems = [];

            for (const item of items) {
                const productSize = await ProductSize.findByPk(item.product_size_id, {
                    include: [Product]
                });

                if (!productSize) {
                    await transaction.rollback();
                    return res.status(404).json(response(404, "Id not found"));
                }

                if (productSize.stock < item.qty) {
                    await transaction.rollback();
                    return res.status(400).json(response(400, "Stock not enough"));
                }

                const price = productSize.Product.price;
                totalPrice += item.qty * price;

                await productSize.update({
                    stock: productSize.stock - item.qty
                }, {
                    transaction
                });

                orderItems.push({
                    product_size_id: item.product_size_id,
                    qty: item.qty,
                    price
                });
            }

            const order = await Order.create({
                user_id: userId,
                address_id: data.address_id,
                payment_id: data.payment_id,
                orderDate: new Date(),
                totalPrice,
                status: "pending"
            }, {
                transaction
            });

            const finalOrderItems = orderItems.map(item => ({
                order_id: order.id,
                product_size_id: item.product_size_id,
                qty: item.qty,
                price: item.price
            }));

            await OrderItem.bulkCreate(finalOrderItems, {
                transaction
            });


            const result = await Order.findByPk(order.id, {
                include: [
                    {
                        model: OrderItem,
                        as: "items"
                    }
                ]
            });

            await transaction.commit();
            return res.status(201).json(response(201, "Success", result));

        } catch (error) {
            await transaction.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}