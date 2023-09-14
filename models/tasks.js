'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js')

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
  createdBy: {
    type: DataTypes.INTEGER,
  },
  closedOn: {
    type: DataTypes.DATE
  },
  closedBy: {
    type: DataTypes.INTEGER
  },
}, {
  sequelize,
  modelName: 'Tasks',
});

module.exports = Tasks

