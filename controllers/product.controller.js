const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Product } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");
const { group } = require("console");


module.exports = {
    createProduct: async (req, res) => {
        try {
            const { name, description, price, brand, category } = req.body;
            const { image } = req.file;

            const schema = {
                name: { type: "string" },
                description: { type: "string", min: 5 },
                price: { type: "number", positive: true, integer: true },
                brand: { type: "string" },
                category: { type: "string" }
            }

            const data = {
                name: name,
                description: description,
                price: Number(price),
                brand: brand,
                category: category
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // Jika hasil vaalidate ada error
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            // Cek jika image tidak diupload (req.file : mengambil input file)
            if (!req.file) {
                return res.status(400).json(response(400, "validasi Error", "Image not found"));
            }

            const product = await Product.create({
                name: data.name,
                description: data.description,
                price: data.price,
                brand: data.brand,
                category: data.category,
                image: req.file.filename,
            });
            return res.status(201).json(response(201, "created", product));

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const { name, description, price, brand, category } = req.body;
            const { image } = req.file;

            const schema = {
                name: { type: "string" },
                description: { type: "string", min: 5 },
                price: { type: "number", positive: true, integer: true },
                brand: { type: "string" },
                category: { type: "string" }
            }

            const data = {
                name: name,
                description: description,
                price: Number(price),
                brand: brand,
                category: category
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            const product = await Product.findByPk(id); //ambil data sebelumnya
            if (!product) {
                return res.status(400).json(response(400, "Validasi Error", "Data not found"));
            }
            // Kalau ada file baru, file lama dihapus
            if (req.file) {
                const imageName = product.getDataValue('image');
                // Karena image udah diganti jadi link di getter model di ambil yang aslinya pake getDataValue
                // Cari image ke folder uploads
                const filePath = path.join(__dirname, '../uploads', imageName);
                //cek jika file ada dalam folder tersebut
                if (fs.existsSync(filePath)) {
                    //hapus file
                    fs.unlinkSync(filePath);
                    // Hasil dari proses update hanya true dan false buka data baru
                    const updateProcess = await Product.update({
                        name: data.name,
                        description: data.description,
                        price: data.price,
                        brand: data.brand,
                        category: data.category,
                        // Jika ada data baru ambil namanya, kalau gaada ambil tanpa link (nama ghambar sebelumnya)
                        image: (req.file ? req.file.filename : product.getDataValue('image'))
                    }, {
                        where: { id: id }
                    });
                    const newProduct = await Product.findByPk(id);
                    return res.status(200).json(response(200, "success update", newProduct));
                }
            }



        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },

    getProduct: async (req, res) => {
        try {
            const { page, limit } = req.query;

            const pageNumber = Number(page) || 1;
            const limitNumber = Number(limit) || 12;
            const offset = (Number(pageNumber) - 1) * Number(limitNumber);
            // req.query : ambil params di postman/ambil data acuan untuk search/sort
            // sortBy -> mengurutkan berdasarkan field apa
            // order : ASC/DESC, opsi pengututan
            const { name, brand, sortBy, order } = req.query
            let condition = {};
            if(name){
                condition.name = {
                        [Op.like]: `%${name}%` //mencari yang mirip
                };
            }
            if(brand){
                condition.brand = {
                        [Op.like]: `%${brand}%` //mencari yang mirip
                };
            }

            const { count, rows } = await Product.findAndCountAll({
                where: condition,
                
                offset: Number(offset),
                limit: Number(limitNumber),


                //Cari berdasarkan field name di db dari name req.query
                // kalau di params postman ada sortby order, jalannin pengurutan, klo gaada pake default. misal sortBy wn order DESC
                order: sortBy && order ? [[sortBy, order]] : []
            });
            const formatPagination = {
                data: rows, //data yang dimunculkan
                limit: limit,
                rows: (Number(offset) + 1) + "-" + (Number(offset) + rows.length),
                total: count, //jumlah data keseluruhan
                page: page, //sedang di halaman ke berapa
            }

            return res.status(200).json(response(200, 'Success', formatPagination));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },

    getBrands: async (req, res) => {
        try{
            const brands = await Product.findAll({
                attributes: ["brand"],
                group: ["brand"]
            });

           return res.status(200).json(response(200, "success", brands));
        }catch(error){
            return res.status(500).json(response(500,"Server Error", error.message));
        }
    },

    showProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findByPk(id);
            if (!product) {
                return res.status(400).json(response(400, "Data product [id] not found"));
            }
            return res.status(200).json(response(200, "Success", product));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await Product.findByPk(id);
            const imageName = product.getDataValue('image');
            // Karena image udah diganti jadi link di getter model di ambil yang aslinya pake getDataValue
            // Cari image ke folder uploads
            const filePath = path.join(__dirname, '../uploads', imageName);
            if (fs.existsSync(filePath)) {
                // hapus file
                fs.unlinkSync(filePath);
            }
            const deleteProcess = await Product.destroy({
                where: { id: id }
            });
            return res.status(200).json(response(200, 'deleted'));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }
}