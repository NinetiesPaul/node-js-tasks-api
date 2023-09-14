const Sequelize = require ('sequelize');

const connection = new Sequelize('tasks-api_nodejs', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    define: {
        timestamps: false
    },
});

module.exports = connection