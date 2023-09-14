const Sequelize = require ('sequelize');

const connection = require('../db/connection.js')

const Users = connection.define('users', {
    name: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
    },
    password: {
        type: Sequelize.STRING,
    }
})

module.exports = Users