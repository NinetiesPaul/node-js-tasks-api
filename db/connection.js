require('dotenv').config();
const Sequelize = require ('sequelize');

const connection = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_ENGINE,
    port: process.env.DB_PORT,
    define: {
        timestamps: false
    },
});

module.exports = connection