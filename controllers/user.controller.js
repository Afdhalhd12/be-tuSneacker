const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { User } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");
const passwordHash = require('password-hash');
const { auth_secret } = require('../config/base.config');
const jwt = require('jsonwebtoken');
const ExcelJs = require('exceljs');

module.exports = {
    signUp: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            const schema = {
                name: { type: "string" },
                email: { type: "string" },
                password: { type: "string" },
            }

            const data = {
                name: name,
                email: email,
                password: passwordHash.generate(password)
            }
            
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // Cek apakah email sudah terdaftar atau belum
            const existingUser = await User.findOne({ where: { email: email } });
            // findOne : mencari 1 data yang bukan primary key
            if (existingUser) {
                return res.status(400).json(response(400, "Validasi Error", "Email Duplicated. Try another email"));
            }
            const newUser = await User.create(data);
            return res.status(201).json(response(201, "Success create account"));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const schema = {
                email: { type: "string" },
                password: { type: "string" }
            }
            const data = {
                email: email,
                password: password
            }
            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                return res.status(400).json(response(400, "Validasi Error", validate));
            }
            //cek apakah email tsb ada di table user?
            const user = await User.findOne({ where: { email: email } });
            // findOne : mencari 1 data bukan berdasarkan primary key
            if (!user) {
                return res.status(400).json(response(400, "Email not found. Try again", "Email not found. Try again"));
            }
            //mencocokan password teks dengan password encrpty
            const checkPassword = passwordHash.verify(password, user.password);
            // Jika tidak cocok
            if (!checkPassword) {
                return res.status(400).json(response(400, "Password incorrect. Try again!", "Password incorrect. Try again!"));
            }

            //jika validasi berhasil, buat token jwt
            const token = jwt.sign({ userId: user.id, email: user.email, name: user.name, role: user.role }, auth_secret);
            if (!token) {
                return res.status(400).json(response(400, "login failed", "login failed"));
            }
            //output
            const formatData = {
                data: user,
                token: token
            }
            return res.status(200).json(response(200, "success", formatData));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },

    getUser: async (req, res) => {
        try {
            const { page, limit } = req.query;
            // page : ambil data di halaman ke berapa, limit : munculin data berapa
            // offset : menentukan data yang dimunculkan mulai dari berapa
            const offset = (Number(page) - 1) * Number(limit);
            // contoh page 1 = 1-1 = 0 , limitnya 10 : 0 * 10 = 0 jadi offset nya 0
            //data nya dimulai dari 1, halaman ke 1 datanya 1-10
            //contoh page 2 = 2-1 = 1, limit nya 10 : 1 * 10 = 10, jadi offset nya 10 data nya dimulai dari 11, halaman ke 2 10-20
            const { name, sortBy, order } = req.query
            let condition = {
                role: "user"
            };

            if (name) {
                condition.name = {
                    [Op.like]: `%${name}%` //mencari yang mirip
                };

            }
            const { count, rows } = await User.findAndCountAll({
                where: condition,
                offset: Number(offset),
                limit: Number(limit),

                order: sortBy && order ? [[sortBy, order]] : []

            });
            const formatPagination = {
                data: rows, //data yang dimunculkan
                limit: limit,
                rows: (Number(offset) + 1) + "-" + (Number(offset) + rows.length),
                total: count, //jumlah data keseluruhan
                page: page, //sedang di halaman ke berapa
            }

            return res.status(200).json(response(200, "success", formatPagination));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    showUser: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(400).json(response(400, "Data user [id] not found"));
            }
            return res.status(200).json(response(200, "Success", user));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            const deleteProcess = await User.destroy({
                where: { id: id }
            });

            if (!deleteProcess) {
                return res.status(404).json(response(404, "User not found"));
            }
            return res.status(200).json(response(200, 'deleted', deleteProcess));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },

    updateUser: async (req, res) => {
        try {
            const userId = req.user.userId;

            const user = await User.findByPk(userId);


            const { name, email, password } = req.body;
            if (!user) {
                return res
                    .status(404)
                    .json(response(404, "User not found"));
            }

            const schema = {
                name: { type: "string", optional: true },
                email: { type: "email", optional: true },
                password: { type: "string", min: 6, optional: true },
            };

            const data = {
                name,
                email,
                password
            };

            const validate = v.validate(data, schema);

            if (validate.length > 0) {
                return res
                    .status(400)
                    .json(response(400, "Validation Error", validate));
            }


            if (req.file) { // cek apakah user upload foto baru

                const imageName = user.getDataValue('photoProfile'); // ambil nama foto lama dari database

                if (imageName) { // cek apakah user punya foto lama

                    const filePath = path.join(
                        __dirname,
                        '../uploads',
                        imageName
                    ); // buat path lengkap ke file lama

                    if (fs.existsSync(filePath)) { // cek apakah file lama masih ada di folder uploads

                        fs.unlinkSync(filePath); // hapus file lama

                    }
                }
            }

            let existingUser = null;

            // Cek apakah email sudah terdaftar atau belum
            if (email && email !== user.email) {
                const existingUser = await User.findOne({
                    where: {
                        email: email
                    }
                });
            }
            if (existingUser) {
                return res.status(400).json(response(400, "Validasi Error", "Email Duplicated. Try another email"));
            }

            await User.update({
                name: name || user.name,
                email: email || user.email,
                password: password
                    ? passwordHash.generate(password)
                    : user.password,
                photoProfile: req.file
                    ? req.file.filename
                    : user.getDataValue('photoProfile')
            }, {
                where: { id: userId }
            });

            const newUser = await User.findByPk(userId, {
                attributes: {
                    exclude: ['password']
                }
            });

            return res
                .status(200)
                .json(response(200, "success update", newUser));

        } catch (error) {
            return res
                .status(500)
                .json(response(500, "Server Error", error.message));
        }
    },

    updateUserByAdmin: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await User.findByPk(id);


            const { name, email, password } = req.body;
            if (!user) {
                return res
                    .status(404)
                    .json(response(404, "User not found"));
            }

            const schema = {
                name: { type: "string", optional: true },
                email: { type: "email", optional: true },
                password: { type: "string", min: 6, optional: true },
            };

            const data = {
                name,
                email,
                password
            };

            const validate = v.validate(data, schema);

            if (validate.length > 0) {
                return res
                    .status(400)
                    .json(response(400, "Validation Error", validate));
            }


            if (req.file) {
                const imageName = user.getDataValue('photoProfile');

                if (imageName) {
                    const filePath = path.join(__dirname, '../uploads', imageName);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
            }

            let existingUser = null;

            // Cek apakah email sudah terdaftar atau belum
            if (email && email !== user.email) {
                existingUser = await User.findOne({
                    where: {
                        email: email
                    }
                });
            }
            if (existingUser) {
                return res.status(400).json(response(400, "Validasi Error", "Email Duplicated. Try another email"));
            }

            await User.update({
                name: name || user.name,
                email: email || user.email,
                password: password
                    ? passwordHash.generate(password)
                    : user.password,
                photoProfile: req.file
                    ? req.file.filename
                    : user.getDataValue('photoProfile')
            }, {
                where: { id: id }
            });

            const newUser = await User.findByPk(id, {
                attributes: {
                    exclude: ['password']
                }
            });

            return res
                .status(200)
                .json(response(200, "success update", newUser));

        } catch (error) {
            return res
                .status(500)
                .json(response(500, "Server Error", error.message));
        }
    },

    getProfile: async (req, res) => {
        try {
            const userId = req.user.userId;

            const user = await User.findByPk(userId);

            if (!user) {
                return res
                    .status(404)
                    .json(response(404, "User not found"));
            }

            return res
                .status(200)
                .json(response(200, "Success", user));

        } catch (error) {
            return res
                .status(500)
                .json(response(500, "Server Error", error.message));
        }
    },

    exportUsers: async (req, res) => {
        try {
            // Ambil data user yang role nya sebagai user
            // Jangan ikut sertakan passsword
            const users = await User.findAll({
                where: {
                    role: "user",
                },
                attributes: { exclude: ['password'] }
            })

            //exceljs.Workbook() : bawaan package exceljs utk membuat file excel baru di memory
            // 1 workbook = 1 file
            const workbook = new ExcelJs.Workbook();
            // Buat worksheet : menambah sheet/tab baru di dalam file excel
            const worksheet = workbook.addWorksheet('Users');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Nama', key: 'name', width: 30 },
                { header: 'Email', key: 'email', width: 40 },
                { header: 'Role', key: 'role', width: 15 },
            ];

            // Masukkan data ke worksheet
            users.forEach(user => {
                worksheet.addRow({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                });
            });


            //! setHeader : response supaya browser/postman tau ini tuh file excel dan bukan json
            // Content-Type : memberitahu tipe file yang dikirim berupa format excel
            // Content-Disposition : memberitahu browser untuk download file, bukan tampilkan di layar
            // 'attachment' = download, filename = nama file hasil download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=daftar-pengguna.xlsx');


            // workbook.xlsx.write(res) : tulis isi file excel lgsg ke response HTTP
            // res di sini sbg tempat tujuan stream file dr exceljs tadi
            await workbook.xlsx.write(res);

            // res.end() : tanda buat response selesai dikirim. wajib dipanggil setelah write() karena write() ga otomatis nutup response
            // tanpa ini, koneksi HTTP tidak pernah ditutup dan file tidak selesai terdownload
            res.end();

        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    }


}