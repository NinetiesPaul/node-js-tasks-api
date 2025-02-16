'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js');
const User = require('./user.js');
const Tasks = require('./tasks.js');

class TaskComment extends Model {}

TaskComment.init({
  text: DataTypes.STRING,
  createdOn: DataTypes.DATE
}, {
  sequelize,
  modelName: 'TaskComment',
});

TaskComment.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'created_by'
})

/*TaskHistory.belongsTo(Tasks, {
  foreignKey: 'task',
  as: 'taskId'
})*/

module.exports = TaskComment