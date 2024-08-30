'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js');
const User = require('./user');
const Tasks = require('./tasks');

class TaskAssignees extends Model {}

TaskAssignees.init({
}, {
  sequelize,
  modelName: 'TaskAssignees',
});

TaskAssignees.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assigned_to'
})

TaskAssignees.belongsTo(User, {
  foreignKey: 'assignedBy',
  as: 'assigned_by'
})

/*TaskAssignees.belongsTo(Tasks, {
  foreignKey: 'task',
  as: 'taskId'
})*/

module.exports = TaskAssignees