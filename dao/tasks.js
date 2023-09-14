const Sequelize = require ('sequelize');

const sequelize = require('../db/connection.js')

const Tasks = sequelize.define('tasks', {
    title: {
        type: Sequelize.STRING,
    },
    description: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
    createdOn: {
        type: Sequelize.DATE,
    },
    createdBy: {
        type: Sequelize.INTEGER,
    },
    closedOn: {
        type: Sequelize.DATE,
    },
    closedBy: {
        type: Sequelize.INTEGER,
    },

})

module.exports = Tasks
