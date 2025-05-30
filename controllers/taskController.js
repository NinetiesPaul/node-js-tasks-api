const Tasks = require('../models/tasks');
const User = require('../models/user');
const Users = require('../models/user');
const TaskHistory = require('../models/taskhistory');
const TaskAssignees = require('../models/taskassignee');
const TaskComment = require('../models/taskcomment');

const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

function validateTaskType(taskType)
{
    return [ 'feature', 'bugfix', 'hotfix' ].includes(taskType)
}

function validateTaskStatus(taskStatus)
{
    return [ 'open', 'closed', 'in_dev', 'blocked', 'in_qa' ].includes(taskStatus);
}

exports.createTask = async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    if (errorMessages.length > 0) return res.status(400).json({ success: false, message: errorMessages });

    try{

        //if (errorMessages.length > 0) throw new Error(JSON.stringify({ success: false, message: errorMessages }));

        var taskCreated = await Tasks.create({
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            status: "open",
            createdOn: new Date(),
            createdBy: req.authenticatedUserId
        })

        var newTask = await Tasks.findOne({
            where: { id: taskCreated.id },
            attributes: ['id', 'title', 'description', 'status', 'type', ['createdOn', 'created_on'], ['closedOn', 'closed_on']],
            include: [{
                model: User,
                as: 'created_by',
                attributes: ['id', 'name', 'email']
            },{
                model: User,
                as: 'closed_by',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.status(200).json({ success: true, data: newTask })
    } catch(error) {
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            exceptionResponse = { success: false, message: [ error.message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};

exports.listTasks = async (req, res) => {
    try{
        var filters = {};
        var paramErrors = [];

        if (req.query.type) {
            if (!validateTaskType(req.query.type)) paramErrors.push("INVALID_TYPE");
            filters.type = req.query.type;
        }

        if (req.query.status) {
            if (!validateTaskStatus(req.query.status)) paramErrors.push("INVALID_STATUS");
            filters.status = req.query.status;
        }

        if (req.query.created_by) {
            var user = await Users.findOne({
                where: {
                    id: req.query.created_by
                }
            });

            if (!user) paramErrors.push("USER_NOT_FOUND");
            filters.createdBy = req.query.created_by;
        }

        if (paramErrors.length > 0) return res.status(400).json({ success: false, message: paramErrors });

        if (req.query.assigned) {
            if (req.query.assigned == "true") {
                filters['$assignees.id$'] = {
                    [Op.ne]: null
                }
            } else {
                filters['$assignees.id$'] = {
                    [Op.eq]: null
                }
            }
        }

        var tasks = await Tasks.findAll({
            where: filters,
            attributes: ['id', 'title', 'description', 'status', 'type', ['createdOn', 'created_on'], ['closedOn', 'closed_on']],
            include: [
                {
                    model: User,
                    as: 'created_by',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: User,
                    as: 'closed_by',
                    attributes: ['id', 'name', 'email'],
                },
                {
                    model: TaskAssignees,
                    as: 'assignees',
                    attributes: [ 'id' ],
                    include: [
                        {
                            model: User,
                            as: 'assigned_to',
                            attributes: [ 'id', 'name', 'email' ]
                        },
                        {
                            model: User,
                            as: 'assigned_by',
                            attributes: [ 'id', 'name', 'email' ],
                        }
                    ],
                }
            ],
            order: [['createdOn', 'DESC']]
        });
        
        res.json({ success: true, data: { total: tasks.length, tasks: tasks } })
    } catch(error){
        res.status(400).json({ success: false, msg: error.message })
    }
};

exports.viewTask = async (req, res) => {
    try{
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: { id: taskId },
            attributes: ['id', 'title', 'description', 'status', 'type', ['createdOn', 'created_on'], ['closedOn', 'closed_on']],
            include: [{
                model: User,
                as: 'created_by',
                attributes: ['id', 'name', 'email']
            },{
                model: User,
                as: 'closed_by',
                attributes: ['id', 'name', 'email']
            },{
                model: TaskHistory,
                as: 'history',
                attributes: [ 'id', 'field', [ 'changedFrom', 'changed_from' ], [ 'changedTo', 'changed_to' ], [ 'changedOn', 'changed_on' ] ],
                include: {
                    model: User,
                    as: 'changed_by',
                    attributes: [ 'id', 'name', 'email' ]
                }
            },{
                model: TaskAssignees,
                as: 'assignees',
                attributes: [ 'id' ],
                include: [{
                    model: User,
                    as: 'assigned_to',
                    attributes: [ 'id', 'name', 'email' ]
                },{
                    model: User,
                    as: 'assigned_by',
                    attributes: [ 'id', 'name', 'email' ]
                }]
            },{
                model: TaskComment,
                as: 'comments',
                attributes: [ 'id', ['text', 'comment_text'], [ 'createdOn', 'created_on'] ],
                include: [{
                    model: User,
                    as: 'created_by',
                    attributes: [ 'id', 'name', 'email' ]
                }]
            }]
        });

        if (!task) return res.status(404).json({ success: false, message: [ 'TASK_NOT_FOUND' ] });

        res.send({ success: true, data: task })
    } catch(error){
        res.status(400).json({ success: false, message: [ error.message ] })
    }
};

exports.updateTask = async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    try {
        if (errorMessages.length > 0) throw new Error(JSON.stringify({ success: false, message: errorMessages }));

        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });

        if (!task) throw new Error(JSON.stringify({ success: false, message: [ 'TASK_NOT_FOUND' ] }), { cause: 404 });

        if (req.body.hasOwnProperty('status') && req.body.status == "closed") throw new Error(JSON.stringify({ success: false, message: [ 'CAN_NOT_UPDATE_TO_CLOSE' ] }));

        const newData = {};

        let historyEntries = [];

        if (req.body.title && req.body.title != task.title) {
            historyEntries['title'] = [ task.title, req.body.title ]
            newData.title = req.body.title
        }

        if (req.body.description && req.body.description != task.description) {
            historyEntries['description'] = [ task.description, req.body.description ]
            newData.description = req.body.description
        }

        if (req.body.type && req.body.type != task.type) {
            historyEntries['type'] = [ task.type, req.body.type ]
            newData.type = req.body.type
        }

        if (req.body.status && req.body.status != task.status) {
            historyEntries['status'] = [ task.status, req.body.status ]
            newData.status = req.body.status
        }

        for (var entry in historyEntries) {
            await TaskHistory.create({
                field: entry,
                changedFrom: historyEntries[entry][0],
                changedTo: historyEntries[entry][1],
                changedOn: new Date(),
                changedBy: req.authenticatedUserId,
                task: task.id
            })
        }

        await Tasks.update(newData, {
            where: {
                id: taskId
            }
        })

        var updatedTask = await Tasks.findOne({
            where: { id: taskId },
            attributes: ['id', 'title', 'description', 'status', 'type', ['createdOn', 'created_on'], ['closedOn', 'closed_on']],
            include: [{
                model: User,
                as: 'created_by',
                attributes: ['id', 'name', 'email']
            },{
                model: User,
                as: 'closed_by',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.send({ success: true, data: updatedTask })
    } catch (error) {
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            exceptionResponse = { success: false, message: [ error.message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};

exports.closeTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) throw new Error(JSON.stringify({ success: false, message: [ 'TASK_NOT_FOUND' ] }), { cause: 404 });

        if (task.status == "closed") throw new Error(JSON.stringify({ success: false, message: [ 'TASK_ALREADY_CLOSED' ] }));

        await Tasks.update( {
            status: "closed",
            closedOn: new Date(),
            closedBy: req.authenticatedUserId
        }, {
            where: {
                id: taskId
            }
        })

        await TaskHistory.create({
            field: 'status',
            changedFrom: task.status,
            changedTo: 'closed',
            changedOn: new Date(),
            changedBy: req.authenticatedUserId,
            task: task.id
        })

        var updatedTask = await Tasks.findOne({
            where: { id: taskId },
            attributes: ['id', 'title', 'description', 'status', 'type', ['createdOn', 'created_on'], ['closedOn', 'closed_on']],
            include: [{
                model: User,
                as: 'created_by',
                attributes: ['id', 'name', 'email']
            },{
                model: User,
                as: 'closed_by',
                attributes: ['id', 'name', 'email']
            }]
        });
        res.send({ success: true, data: updatedTask })
    } catch (error) {
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            exceptionResponse = { success: false, message: [ error.message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};

exports.assignTask = async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    try{
        if (errorMessages.length > 0) throw new Error(JSON.stringify({ success: false, message: errorMessages }));

        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) throw new Error(JSON.stringify({ success: false, message: [ 'TASK_NOT_FOUND' ] }), { cause: 404 });

        var user = await Users.findOne({
            where: {
                id: req.body.assigned_to
            }
        });
        if (!user) throw new Error(JSON.stringify({ success: false, message: [ 'USER_NOT_FOUND' ] }), { cause: 404 });

        var newTaskAssignment = await TaskAssignees.create({
            assignedTo: user.id,
            assignedBy: req.authenticatedUserId,
            task: task.id
        })
        
        await TaskHistory.create({
            field: "added_assignee",
            changedFrom: "",
            changedTo: user.name,
            changedOn: new Date(),
            changedBy: req.authenticatedUserId,
            task: task.id
        })

        var taskAssignee = await TaskAssignees.findOne({
            where: { id: newTaskAssignment.id },
            attributes: ['id'],
            include: [{
                model: User,
                as: 'assigned_to',
                attributes: ['id', 'name', 'email']
            },{
                model: User,
                as: 'assigned_by',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.send({ success: true, data: taskAssignee })
    } catch(error){
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            let message = "GENERIC_ERROR";

            if (error.name === "SequelizeUniqueConstraintError" ) {
                errorCode = 202;
                message = "USER_ALREADY_ASSIGNED";
            }

            exceptionResponse = { success: false, message: [ message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};

exports.unassignTask = async (req, res) => {
    try{
        const assignmentId = req.params.assignmentId;

        const taskAssignment = await TaskAssignees.findOne({
            where: { id: assignmentId },
            attributes: [ 'id', 'task' ],
            include: [{
                model: User,
                as: 'assigned_to',
                attributes: ['id', 'name', 'email']
            }],
        })
        if (!taskAssignment) throw new Error(JSON.stringify({ success: false, message: [ 'ASSIGNMENT_NOT_FOUND' ] }), { cause: 404 });//return res.status(404).json({ success: false, message: [ 'ASSIGNMENT_NOT_FOUND' ] });

        await TaskAssignees.destroy({
            where: { id: taskAssignment.id }
        })
        
        await TaskHistory.create({
            field: "removed_assignee",
            changedFrom: "",
            changedTo: taskAssignment.assigned_to.name,
            changedOn: new Date(),
            changedBy: req.authenticatedUserId,
            task: taskAssignment.task
        })
        
        res.json({ success: true, data: null })
    } catch (error) {
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            exceptionResponse = { success: false, message: [ error.message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};

exports.createComment = async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    try{
        if (errorMessages.length > 0) throw new Error(JSON.stringify({ success: false, message: errorMessages }));

        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) throw new Error(JSON.stringify({ success: false, message: [ 'TASK_NOT_FOUND' ] }), { cause: 404 });

        var newTaskComment = await TaskComment.create({
            createdOn: new Date(),
            createdBy: req.authenticatedUserId,
            task: task.id,
            text: req.body.text
        })

        var taskComment = await TaskComment.findOne({
            where: { id: newTaskComment.id },
            attributes: ['id', [ 'text', 'comment_text' ], ['createdOn', 'created_on']],
            include: [{
                model: User,
                as: 'created_by',
                attributes: ['id', 'name', 'email']
            }]
        });

        res.send({ success: true, data: taskComment })
    } catch (error) {
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            exceptionResponse = { success: false, message: [ error.message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};

exports.deleteComment = async (req, res) => {
    try{
        const commentId = req.params.commentId;

        const taskComment = await TaskComment.findOne({
            where: { id: commentId }
        })
        if (!taskComment) throw new Error(JSON.stringify({ success: false, message: [ 'COMMENT_NOT_FOUND' ] }), { cause: 404 });

        await TaskComment.destroy({
            where: { id: taskComment.id }
        })
        
        res.json({ success: true, data: null })
    } catch (error) {
        let errorCode = (error.cause) ? error.cause : 400;

        try {
            exceptionResponse = JSON.parse(error.message);
        } catch (parseError) {
            exceptionResponse = { success: false, message: [ error.message ] };
        }

        res.status(errorCode).json(exceptionResponse);
    }
};