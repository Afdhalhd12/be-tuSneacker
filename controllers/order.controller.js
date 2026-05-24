const Validator = require("fastest-validator");
const v = new Validator();

const {
    Product,
    Order,
    OrderItem,
    ProductSize,
    sequelize
} = require("../models");

const { response } = require("../helpers/response.formatter");

module.exports = {
    createOrder: async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            const { address_id, payment_id, items } = req.body;
            const userId = req.user.userId;

            const data = {
                address_id: Number(address_id),
                payment_id: Number(payment_id),
                items
            };

            const schema = {
                address_id: {
                    type: "number",
                    positive: true,
                    integer: true
                },
                payment_id: {
                    type: "number",
                    positive: true,
                    integer: true
                },
                items: {
                    type: "array",
                    min: 1,
                    items: {
                        type: "object",
                        props: {
                            product_size_id: {
                                type: "number",
                                positive: true,
                                integer: true
                            },
                            qty: {
                                type: "number",
                                positive: true,
                                integer: true
                            }
                        }
                    }
                }
            };

            const validate = v.validate(data, schema);

            if (validate.length > 0) {
                await transaction.rollback();

                return res.status(400).json(
                    response(400, "Validation error", validate)
                );
            }

            let totalPrice = 0;
            let orderItems = [];


            for (const item of data.items) {

                const productSize = await ProductSize.findByPk(
                    item.product_size_id,
                    {
                        include: [Product],
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    }
                );

                if (!productSize) {
                    await transaction.rollback();

                    return res.status(404).json(
                        response(404, "Product size not found")
                    );
                }

                // Cek stock cukup atau engga
                if (productSize.stock < item.qty) {
                    await transaction.rollback();

                    return res.status(400).json(
                        response(
                            400,
                            `Stock not enough for product_size_id ${item.product_size_id}`
                        )
                    );
                }

                const price = productSize.Product.price;

                // Hitung total harga
                totalPrice += item.qty * price;

                // Ngurangin stock
                await productSize.update(
                    {
                        stock: productSize.stock - item.qty
                    },
                    {
                        transaction
                    }
                );


                orderItems.push({
                    product_size_id: item.product_size_id,
                    qty: item.qty,
                    price
                });
            }

            // Create Order
            const order = await Order.create(
                {
                    user_id: userId,
                    address_id: data.address_id,
                    payment_id: data.payment_id,
                    orderDate: new Date(),
                    totalPrice,
                    status: "pending"
                },
                {
                    transaction
                }
            );

            // Order item
            const finalOrderItems = orderItems.map((item) => ({
                order_id: order.id,
                product_size_id: item.product_size_id,
                qty: item.qty,
                price: item.price
            }));


            await OrderItem.bulkCreate(finalOrderItems, {
                transaction
            });

            await transaction.commit();

            const result = await Order.findByPk(order.id, {
                include: [
                    {
                        model: OrderItem,
                        as: "items"
                    }
                ]
            });

            return res.status(201).json(
                response(201, "Order created successfully", result)
            );

        } catch (error) {
            await transaction.rollback();

            console.error(error);

            return res.status(500).json(
                response(500, "Internal Server Error")
            );
        }
    },

    paymentUpdate: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body || {};

            const schema = {
                status: {
                    type: "string",
                    enum: ["pending", "success", "failed"]
                }
            };

            const validate = v.validate({ status }, schema);

            if (validate.length > 0) {
                return res.status(400).json(
                    response(400, "Validation error", validate)
                );
            }

            const order = await Order.findByPk(id);

            if (!order) {
                return res.status(404).json(
                    response(404, "Order not found")
                );
            }

            await order.update({ status });

            return res.status(200).json(
                response(200, "Payment updated successfully", order)
            );

        } catch (error) {
            console.error(error);

            return res.status(500).json(
                response(500, "Internal Server Error")
            );
        }
    }
};