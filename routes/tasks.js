const Tasks = require('../models/tasks');
const User = require('../models/user');
const Users = require('../models/user');
const TaskHistory = require('../models/taskhistory');
const TaskAssignees = require('../models/taskassignee');

const { Op } = require('sequelize');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router()
const { check, validationResult } = require('express-validator');
const TaskComment = require('../models/taskcomment');

module.exports = router;

const allowedStatuses = [ 'open', 'closed', 'in_dev', 'blocked', 'in_qa' ];
const allowedTypes = [ 'feature', 'bugfix', 'hotfix' ];

function verifyJWT(req, res, next){
    var token = req.headers['authorization'];
    if (!token) return res.status(401).json({ success: false, message: [ "MISSING_TOKEN" ] });
    
    token = token.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        if (err) return res.status(401).json({ success: false, message: [ "INVALID_TOKEN" ] });

        req.authenticatedUserId = decoded.user.id;
        next();
    });
}

function createValidation()
{
    return [
        check('title').exists().withMessage('MISSING_TITLE'),
        check('title').if(check('title').exists()).isString().withMessage('TITLE_NOT_STRING'),
        check('title').if(check('title').exists()).notEmpty().withMessage('EMPTY_TITLE'),
        check('description').exists().withMessage('MISSING_DESCRIPTION'),
        check('description').if(check('description').exists()).isString().withMessage('DESCRIPTION_NOT_STRING'),
        check('description').if(check('description').exists()).notEmpty().withMessage('EMPTY_DESCRIPTION'),
        check('type').exists().withMessage('MISSING_TYPE'),
        check('type').if(check('type').exists()).isString().withMessage('TYPE_NOT_STRING'),
        check('type').if(check('type').exists()).notEmpty().withMessage('EMPTY_TYPE'),
        check('type').if(check('type').exists()).isIn(['feature', 'bugfix', 'hotfix']).withMessage('INVALID_TYPE'),
    ];
}

function updateValidation()
{
    return [
        check('title').if(check('title').exists()).isString().withMessage('TITLE_NOT_STRING'),
        check('title').if(check('title').exists()).notEmpty().withMessage('EMPTY_TITLE'),
        check('description').if(check('description').exists()).isString().withMessage('DESCRIPTION_NOT_STRING'),
        check('description').if(check('description').exists()).notEmpty().withMessage('EMPTY_DESCRIPTION'),
        check('type').if(check('type').exists()).isString().withMessage('TYPE_NOT_STRING'),
        check('type').if(check('type').exists()).notEmpty().withMessage('EMPTY_TYPE'),
        check('type').if(check('type').exists()).isIn(['feature', 'bugfix', 'hotfix']).withMessage('INVALID_TYPE'),
        check('status').if(check('status').exists())
            .isString().withMessage('STATUS_NOT_STRING')
            .notEmpty().withMessage('EMPTY_STATUS')
            .if(check('status').not().equals('closed')).isIn(['open', 'in_dev', 'blocked', 'in_qa']).withMessage('INVALID_STATUS'),

        check('taskId').custom(async value => {
            var task = await Tasks.findOne({
                where: {
                    id: value,
                    status: 'closed'
                }
            });
            if (task) throw new Error('TASK_CLOSED');
        }),
    ];
}

function assignmentValidation()
{
    return [
        check('assigned_to').exists().withMessage('MISSING_ASSIGNED_TO'),
        check('assigned_to').if(check('assigned_to').exists()).trim().isInt().withMessage('ASSIGNED_TO_NOT_INTEGER'),
    ];
}

function commentValidation()
{
    return [
        check('text').exists().withMessage('MISSING_TEXT'),
        check('text').if(check('text').exists()).isString().withMessage('TEXT_NOT_STRING'),
        check('text').if(check('text').exists()).notEmpty().withMessage('EMPTY_TEXT'),
    ];
}

router.post('/create', verifyJWT, createValidation(), async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    if (errorMessages.length > 0) return res.status(400).json({ success: false, message: errorMessages });
    try{

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
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.get('/list', verifyJWT, async (req, res) => {
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
})

router.get('/view/:taskId', verifyJWT, async (req, res) => {
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
})

router.put('/update/:taskId', verifyJWT, updateValidation(), async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    if (errorMessages.length > 0) return res.status(400).json({ success: false, message: errorMessages });
    try {
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });

        if (!task) return res.status(404).json({ success: false, message: [ 'TASK_NOT_FOUND' ] });

        if (req.body.hasOwnProperty('status') && req.body.status == "closed") return res.status(400).json({ success: false, message: [ "CAN_NOT_UPDATE_TO_CLOSE" ] });

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
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.put('/close/:taskId', verifyJWT, async (req, res) => {
    try {
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) return res.status(404).json({ success: false, message: [ 'TASK_NOT_FOUND' ] });

        if (task.status == "closed") return res.status(400).json({ success: false, message: [ "TASK_ALREADY_CLOSED" ] });

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
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.post('/assign/:taskId', verifyJWT, assignmentValidation(), async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    if (errorMessages.length > 0) return res.status(400).json({ success: false, message: errorMessages });
    try{
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) return res.status(404).json({ success: false, message: [ 'TASK_NOT_FOUND' ] });

        var user = await Users.findOne({
            where: {
                id: req.body.assigned_to
            }
        });
        if (!user) return res.status(404).json({ success: false, message: [ 'USER_NOT_FOUND' ] });

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
        let errorCode = 400;
        let message = "GENERIC_ERROR";
        if (error.name === "SequelizeUniqueConstraintError" ) {
            errorCode = 202;
            message = "USER_ALREADY_ASSIGNED";
        }

        res.status(errorCode).json({ success: false, message: [ message ] })
    }
})

router.delete('/unassign/:assignmentId', verifyJWT, async (req, res) => {
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
        if (!taskAssignment) return res.status(404).json({ success: false, message: [ 'ASSIGNMENT_NOT_FOUND' ] });

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
    } catch(error){
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.delete('/delete/:taskId', verifyJWT, async (req, res) => {
    try {
        const taskId = req.params.taskId;

        const task = await Tasks.destroy({
            where: {
                id: taskId
            }
        })
        if (!task) return res.status(404).json({ success: false, msg: 'TASK_NOT_FOUND' });

        res.send({ success: true, data: "Task id '" + taskId + "' was deleted"})
    } catch (error) {
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.post('/comment/:taskId', verifyJWT, commentValidation(), async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    if (errorMessages.length > 0) return res.status(400).json({ success: false, message: errorMessages });
    try{
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) return res.status(404).json({ success: false, message: [ 'TASK_NOT_FOUND' ] });

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
    } catch(error){
        res.status(400).json({ success: false, message: [ error.message ] })
    }
})

router.delete('/comment/:commentId', verifyJWT, async (req, res) => {
    try{
        const commentId = req.params.commentId;

        const taskComment = await TaskComment.findOne({
            where: { id: commentId }
        })
        if (!taskComment) return res.status(404).json({ success: false, message: [ 'COMMENT_NOT_FOUND' ] });

        await TaskComment.destroy({
            where: { id: taskComment.id }
        })
        
        res.json({ success: true, data: null })
    } catch(error){
        res.status(400).json({ success: false, msg: error.message })
    }
})

function validateTaskType(taskType)
{
    return allowedTypes.includes(taskType)
}

function validateTaskStatus(taskStatus)
{
    return allowedStatuses.includes(taskStatus);
}