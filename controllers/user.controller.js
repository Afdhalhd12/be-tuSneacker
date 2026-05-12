const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { User } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");
const passwordHash = require('password-hash');
const { auth_secret } = require('../config/base.config')
const jwt = require('jsonwebtoken')

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
                return res.status(400).json(response(400, "Validasi Error", "Email not found. Try again"));
            }
            //mencocokan password teks dengan password encrpty
            const checkPassword = passwordHash.verify(password, user.password);
            // Jika tidak cocok
            if (!checkPassword) {
                return res.status(400).json(response(400, "validasi error", "Password incorrect. Try again!"));
            }

            //jika validasi berhasil, buat token jwt
            const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, auth_secret);
            if (!token) {
                return res.status(400).json(response(400, "validasi error", "login failed"));
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
            const { count, rows } = await User.findAndCountAll({
                offset: Number(offset),
                limit: Number(limit),
               
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
    }


}