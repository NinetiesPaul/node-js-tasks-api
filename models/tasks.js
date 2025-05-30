'use strict';
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = require('../db/connection.js');
const User = require('./user.js');
const TaskHistory = require('./taskhistory.js');
const TaskAssignee = require('./taskassignee.js');
const TaskComment = require('./taskcomment.js');

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
  as: 'created_by'
})

Tasks.belongsTo(User, {
  foreignKey: 'closedBy',
  as: 'closed_by'
})

Tasks.hasMany(TaskHistory, {
  foreignKey: 'task',
  as: 'history'
})

Tasks.hasMany(TaskAssignee, {
  foreignKey: 'task',
  as: 'assignees'
})

Tasks.hasMany(TaskComment, {
  foreignKey: 'task',
  as: 'comments'
})

module.exports = Tasks

