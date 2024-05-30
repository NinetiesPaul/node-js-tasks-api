'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js');
const User = require('./user');
const Tasks = require('./tasks');

class TaskHistory extends Model {}

TaskHistory.init({
  field: DataTypes.STRING,
  changedFrom: DataTypes.STRING,
  changedTo: DataTypes.STRING,
  changedOn: DataTypes.DATE
}, {
  sequelize,
  modelName: 'TaskHistory',
});

TaskHistory.belongsTo(User, {
  foreignKey: 'changedBy',
  as: 'changed_by'
})

/*TaskHistory.belongsTo(Tasks, {
  foreignKey: 'task',
  as: 'taskId'
})*/

module.exports = TaskHistory