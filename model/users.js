const Sequelize = require ('sequelize');
const connection = new Sequelize('tasks-api_nodejs', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    define: {
        timestamps: false
    },
});

const Users = connection.define('users', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    }
})

module.exports = Users