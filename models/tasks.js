'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js');
const User = require('./user.js');

class Tasks extends Model {}

Tasks.init({
  title: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.STRING,
  },
  createdOn: {
    type: DataTypes.DATE,
  },
  closedOn: {
    type: DataTypes.DATE
  },
}, {
  sequelize,
  modelName: 'Tasks',
});

Tasks.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'createdByUser'
})

Tasks.belongsTo(User, {
  foreignKey: 'closedBy',
  as: 'closedByUser'
})

module.exports = Tasks

