const Sequelize = require ('sequelize');

const connection = require('../db/connection.js')

const Tasks = connection.define('tasks', {
    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    createdOn: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    closedOn: {
        type: Sequelize.DATE,
    },
    closedBy: {
        type: Sequelize.INTEGER,
    },

})

module.exports = Tasks
