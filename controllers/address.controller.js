const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Address, User } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op, where } = require("sequelize");

module.exports = {
    createAddress: async (req, res) => {
        try {
            const { addressLine, city, postalCode, notes, label, isPrimary } = req.body
            const schema = {
                addressLine: { type: "string" },
                city: { type: "string" },
                postalCode: { type: "string" },
                notes: { type: "string", optional: true },
                label: { type: "enum", values: ["home", "office"] },
                isPrimary: { type: "boolean", optional: true, }
            }

            const data = {
                addressLine: addressLine,
                city: city,
                postalCode: postalCode,
                notes: notes,
                label: label,
                isPrimary: isPrimary
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // Jika hasil vaalidate ada error
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // Jika alamat baru dijadikan primary
            if (data.isPrimary === true) {
                await Address.update(
                    { isPrimary: false },
                    {
                        where: {
                            user_id: req.user.userId
                        }
                    }
                );
            }
            const address = await Address.create({
                addressLine: data.addressLine,
                city: data.city,
                postalCode: data.postalCode,
                notes: data.notes,
                label: data.label,
                isPrimary: data.isPrimary || false,
                user_id: req.user.userId,
            });

            return res.status(201).json(response(201, "created", address));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message))
        }
    },

    getAddress: async (req, res) => {

        try {

            const userId = req.user.userId;

            const addresses = await Address.findAll({

                where: {
                    user_id: userId
                },

                include: [
                    {
                        model: User,
                        attributes: ['name']
                    }
                ],

                order: [
                    ["isPrimary", "DESC"]
                ]

            });

            return res.status(200).json(
                response(200, "Success", addresses)
            );

        } catch (error) {

            return res.status(500).json(
                response(500, "Server Error", error.message)
            );

        }

    },

    deleteAddress: async (req, res) => {
        try {
            const { id } = req.params;
            const deleteProcess = await Address.destroy({
                where: { id: id }
            });

            if (!deleteProcess) {
                return res.status(404).json(response(404, "Address not found"));
            }
            return res.status(200).json(response(200, 'deleted', deleteProcess));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    updateAddress: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId
            const { addressLine, city, postalCode, notes, label, isPrimary } = req.body
            const schema = {
                addressLine: { type: "string" },
                city: { type: "string" },
                postalCode: { type: "string" },
                notes: { type: "string", optional: true },
                label: { type: "enum", values: ["home", "office"] },
                isPrimary: { type: "boolean", optional: true, }
            }

            const data = {
                addressLine: addressLine,
                city: city,
                postalCode: postalCode,
                notes: notes,
                label: label,
                isPrimary: isPrimary
            }

            const validate = v.validate(data, schema);
            if (validate.length > 0) {
                // Jika hasil vaalidate ada error
                return res.status(400).json(response(400, "Validasi Error", validate));
            }

            // Jika alamat baru dijadikan primary
            if (data.isPrimary === true) {
                await Address.update(
                    { isPrimary: false },
                    {
                        where: {
                            user_id: req.user.userId
                        }
                    }
                );
            }
            const address = await Address.update({
                addressLine: data.addressLine,
                city: data.city,
                postalCode: data.postalCode,
                notes: data.notes,
                label: data.label,
                isPrimary: data.isPrimary || false,
            }, {
                where: {
                    id,
                    user_id: userId
                }
            });

            if (address[0] === 0) {
                return res.status(404).json(
                    response(404, "Address not found")
                );
            }

            return res.status(200).json(response(200, "Success", address));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }
    },

    getDetailAddress: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const address = await Address.findOne({
                where: {
                    id,
                    user_id: userId
                }
            });

            if (!address) {
                return res.status(404).json(response(404, "Address not found"));
            }

            return res.status(200).json(response(200, "Success", address));
        } catch (error) {
            return res.status(500).json(response(500, "Server Error", error.message));
        }

    }
}

