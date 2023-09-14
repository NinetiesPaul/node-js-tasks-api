const Sequelize = require ('sequelize');

const sequelize = require('../db/connection.js')

const Users = sequelize.define('users', {
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