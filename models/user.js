'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js')

class User extends Model {}

User.init({
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  password: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  modelName: 'User',
});

module.exports = User