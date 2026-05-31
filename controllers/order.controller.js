const Validator = require("fastest-validator");
const v = new Validator();

const {
    Product,
    Order,
    OrderItem,
    ProductSize,
    Size,
    User,
    sequelize
} = require("../models");

const { response } = require("../helpers/response.formatter");
const { Op } = require("sequelize");

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
            // Ambil id order dari URL
            // Contoh: /orders/1
            const { id } = req.params;

            // Ambil status baru dari body request
            // Contoh:
            // {
            //    "status": "shipped"
            // }
            const { status } = req.body || {};

            // Validasi status yang diperbolehkan
            const schema = {
                status: {
                    type: "string",
                    // Status hanya boleh salah satu dari nilai berikut
                    enum: [
                        "pending",
                        "processing",
                        "shipped",
                        "delivered",
                        "cancelled"
                    ]
                }
            };

            // Jalankan validasi
            const validate = v.validate({ status }, schema);

            // Jika validasi gagal
            if (validate.length > 0) {
                return res.status(400).json(
                    response(400, "Validation error", validate)
                );
            }

            // Cari order berdasarkan id
            const order = await Order.findByPk(id);

            // Jika order tidak ditemukan
            if (!order) {
                return res.status(404).json(
                    response(404, "Order not found")
                );
            }

            // Update status order
            await order.update({
                status
            });

            // Kirim response berhasil
            return res.status(200).json(
                response(
                    200,
                    "Payment updated successfully",
                    order
                )
            );

        } catch (error) {
            // Jika terjadi error server
            return res.status(500).json(
                response(500, "Server Error", error.message)
            );
        }
    },

    getOrdersNonPending: async (req, res) => {
        try {

            const orders = await Order.findAll({
                where: {
                    status: {
                        [Op.ne]: "pending"
                    }
                },
                include: [
                    {
                        model: User,
                        attributes: {
                            exclude: ['password']
                        }
                    },
                    {
                        model: OrderItem,
                        as: "items",
                        include: [
                            {
                                model: ProductSize,
                                include: [
                                    Product,
                                    Size
                                ]
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            return res.status(200).json(
                response(200, "Success get orders", orders)
            );

        } catch (error) {
            console.error(error);

            return res.status(500).json(
                response(500, "Internal Server Error")
            );
        }
    },

    getOrdersForUser: async (req, res) => {
        try {
            const userId = req.user.userId;
            const orders = await Order.findAll({
                where: {
                    user_id: userId
                },
                include: [
                    {
                        model: OrderItem,
                        as: "items",
                        include: [
                            {
                                model: ProductSize,
                                include: [
                                    Product,
                                    Size
                                ]
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            return res.status(200).json(
                response(200, "Success get orders", orders)
            );



        } catch (error) {
            console.error(error);

            return res.status(500).json(
                response(500, "Internal Server Error")
            );
        }
    },

    getDetailOrder: async (req, res) => {
        try {
            const { id } = req.params;

            const userId = req.user.userId;
            const orders = await Order.findOne({
                where: {
                    id,
                    user_id: userId
                },
                include: [
                    {
                        model: OrderItem,
                        as: "items",
                        include: [
                            {
                                model: ProductSize,
                                include: [
                                    Product,
                                    Size
                                ]
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            if(!orders){
                return res.status(404).json(response(404, "Order Not Found"));
            }

            return res.status(200).json(
                response(200, "Success get orders", orders)
            );


        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }

};