const Validator = require("fastest-validator");
const v = new Validator();
const path = require("path")
const fs = require('fs');
const { Product, Order, OrderItem, ProductSize } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require("sequelize");