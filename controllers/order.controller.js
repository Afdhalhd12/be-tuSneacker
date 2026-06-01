const Validator = require("fastest-validator");
const v = new Validator();
const { Product, Order, OrderItem, ProductSize, Size, User, sequelize } = require("../models");
const { response } = require("../helpers/response.formatter");
const { Op } = require("sequelize");

module.exports = {
    createOrder: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { address_id, payment_id, product_size_id, qty } = req.body;
            const userId = req.user.userId;

            const schema = {
                address_id: { type: "number", positive: true, integer: true },
                payment_id: { type: "number", positive: true, integer: true },
                product_size_id: { type: "number", positive: true, integer: true },
                qty: { type: "number", positive: true, integer: true }
            };

            const data = {
                address_id: Number(address_id),
                payment_id: Number(payment_id),
                product_size_id: Number(product_size_id),
                qty: Number(qty)
            };


            const validate = v.validate(data, schema);

            if (validate.length > 0) {
                await transaction.rollback();

                return res.status(400).json(
                    response(400, "Validation Error", validate)
                );
            }

            const productSize = await ProductSize.findByPk(
                product_size_id,
                {
                    include: [Product],
                    transaction,
                    // Lock row database untuk mencegah
                    // checkout bersamaan menyebabkan stock minus
                    lock: transaction.LOCK.UPDATE
                }
            );

            if (!productSize) {
                await transaction.rollback();

                return res.status(404).json(
                    response(404, "Product size not found")
                );
            }

            if (productSize.stock < qty) {
                await transaction.rollback();

                return res.status(400).json(
                    response(400, "Stock not enough")
                );
            }

            const price = productSize.Product.price;
            const totalPrice = price * qty;

            await productSize.update(
                {
                    stock: productSize.stock - qty
                },
                {
                    transaction
                }
            );

            const order = await Order.create(
                {
                    user_id: userId,
                    address_id,
                    payment_id,
                    orderDate: new Date(),
                    totalPrice,
                    status: "pending"
                },
                {
                    transaction
                }
            );

            await OrderItem.create(
                {
                    order_id: order.id,
                    product_size_id,
                    qty,
                    price
                },
                {
                    transaction
                }
            );

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
                response(
                    201,
                    "Order created successfully",
                    result
                )
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
                        [Op.notIn]: ["pending", "cart"]
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
            const { status } = req.query;

            let condition = {
                user_id: userId,
                status: {
                    [Op.ne]: 'cart'
                }
            };

            if (status) {
                condition.status = status;
            }
            
            const orders = await Order.findAll({
                where: condition,
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

            if (!orders) {
                return res.status(404).json(response(404, "Order Not Found"));
            }

            return res.status(200).json(
                response(200, "Success get orders", orders)
            );


        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    addToCart: async (req, res) => {
        try {

            const userId = req.user.userId;
            const { product_size_id, qty } = req.body;

            // Menggunakan Order dengan status "cart"
            // karena OrderItem sudah memiliki product_size_id,
            // qty, dan price sehingga tidak perlu membuat
            let cart = await Order.findOne({
                where: {
                    user_id: userId,
                    status: "cart"
                }
            });

            // Jika user belum memiliki cart,
            // buat Order baru dengan status "cart"
            if (!cart) {
                cart = await Order.create({
                    user_id: userId,
                    totalPrice: 0,
                    status: "cart"
                });
            }

            // Ambil data ProductSize beserta Product
            // untuk mendapatkan harga produk
            const productSize = await ProductSize.findByPk(
                product_size_id,
                {
                    include: [Product]
                }
            );

            // Validasi ProductSize
            if (!productSize) {
                return res.status(404).json(
                    response(404, "Product not found")
                );
            }

            // Cek stok tersedia
            if (productSize.stock < qty) {
                return res.status(400).json(
                    response(400, "Stock not enough")
                );
            }

            // Cek apakah produk dengan size yang sama
            // sudah ada di cart user
            const existingItem = await OrderItem.findOne({
                where: {
                    order_id: cart.id,
                    product_size_id
                }
            });

            if (existingItem) {
                // Jika sudah ada,
                // tambahkan qty agar tidak membuat item duplikat
                await existingItem.update({
                    qty: existingItem.qty + qty
                });

            } else {

                // Jika belum ada,
                // buat item baru di cart
                await OrderItem.create({
                    order_id: cart.id,
                    product_size_id,
                    qty,
                    // Simpan harga saat produk masuk cart
                    // agar perubahan harga di masa depan
                    // tidak mempengaruhi item yang sudah ada
                    price: productSize.Product.price
                });

            }

            // Ambil semua item dalam cart
            const items = await OrderItem.findAll({
                where: {
                    order_id: cart.id
                }
            });

            // Hitung ulang total harga cart
            const totalPrice = items.reduce(
                (sum, item) => {
                    return sum + (item.qty * item.price);
                },
                0
            );

            // Update total harga pada Order(cart)
            await cart.update({
                totalPrice
            });

            return res.status(200).json(
                response(
                    200,
                    "Added to cart successfully",
                    {
                        cartId: cart.id,
                        totalPrice
                    }
                )
            );

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    getCart: async (req, res) => {
        try {
            const userId = req.user.userId;

            const cart = await Order.findOne({
                where: {
                    user_id: userId,
                    status: "cart"
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
                ]
            });

            if (!cart) {
                return res.status(200).json(
                    response(200, "Cart empty", null)
                );
            }

            return res.status(200).json(
                response(200, "Success get cart", cart)
            );

        } catch (error) {
            return res.status(500).json(
                response(500, "Server Error", error.message)
            );
        }
    },

    checkoutCart: async (req, res) => {
        // Membuat transaction agar semua query berhasil atau gagal bersamaan
        const transaction = await sequelize.transaction();
        try {
            const userId = req.user.userId;
            const { address_id, payment_id } = req.body;

            // Mencari cart milik user
            const cart = await Order.findOne({
                where: {
                    user_id: userId,
                    status: "cart",
                },
                include: [
                    {
                        model: OrderItem,
                        as: "items"
                        // include digunakan untuk mengambil relasi Order -> OrderItem
                        // sehingga item cart ikut tampil di response
                    }
                ],
                transaction
            });

            // Jika cart tidak ditemukan
            if (!cart) {
                await transaction.rollback();

                return res.status(404).json(
                    response(404, "Cart not found")
                );
            }

            // Jika cart kosong
            if (cart.items.length === 0) {
                await transaction.rollback();

                return res.status(400).json(
                    response(400, "Cart is empty")
                );
            }

            // Loop seluruh item dalam cart
            for (const item of cart.items) {

                const productSize = await ProductSize.findByPk(
                    item.product_size_id,
                    {
                        transaction,

                        // Lock row database untuk mencegah
                        // checkout bersamaan menyebabkan stock minus
                        lock: transaction.LOCK.UPDATE
                    }
                );

                // Validasi product size
                if (!productSize) {
                    throw new Error(
                        `Product Size ${item.product_size_id} not found`
                    );
                }

                // Cek stok tersedia
                if (productSize.stock < item.qty) {
                    await transaction.rollback();

                    return res.status(400).json(
                        response(
                            400,
                            `Stock not enough for product ${item.product_size_id}`
                        )
                    );
                }

                // Mengurangi stok sesuai qty yang dibeli
                await productSize.update(
                    {
                        stock: productSize.stock - item.qty
                    },
                    {
                        transaction
                    }
                );
            }

            // Mengubah cart menjadi order pending
            await cart.update(
                {
                    address_id,
                    payment_id,
                    orderDate: new Date(),
                    status: "pending"
                },
                {
                    transaction
                }
            );

            // Simpan seluruh perubahan ke database
            await transaction.commit();
            // Menampilkan hasil checkout
            return res.status(200).json(response(200, "Checkout success", cart));
        } catch (error) {
            // Jika ada error, batalkan semua perubahan database
            await transaction.rollback();
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },


    updateQty: async (req, res) => {
        try {

            const userId = req.user.userId;

            const { order_item_id, qty } = req.body;

            // Cari cart aktif user
            const cart = await Order.findOne({
                where: {
                    user_id: userId,
                    status: "cart"
                }
            });

            if (!cart) {
                return res.status(404).json(
                    response(404, "Cart not found")
                );
            }

            // Cari item dalam cart
            const item = await OrderItem.findOne({
                where: {
                    id: order_item_id,
                    order_id: cart.id
                }
            });

            if (!item) {
                return res.status(404).json(
                    response(404, "Item not found")
                );
            }

            // Ambil stok produk
            const productSize = await ProductSize.findByPk(
                item.product_size_id
            );

            if (!productSize) {
                return res.status(404).json(
                    response(404, "Product not found")
                );
            }

            // Validasi stok
            if (qty > productSize.stock) {
                return res.status(400).json(
                    response(400, "Stock not enough")
                );
            }

            // Kalau qty lebih dari 0 ilangin 
            if (qty <= 0) {

                await item.destroy();

            } else {

                await item.update({
                    qty
                });
            }


            // Ambil semua item cart
            const items = await OrderItem.findAll({
                where: {
                    order_id: cart.id
                }
            });

            // Hitung ulang total harga
            const totalPrice = items.reduce(
                (sum, item) => {
                    return sum + (item.qty * item.price);
                },
                0
            );

            // Update total cart
            await cart.update({
                totalPrice
            });

            return res.status(200).json(
                response(
                    200,
                    "Qty updated successfully",
                    {
                        item,
                        totalPrice
                    }
                )
            );

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },
};