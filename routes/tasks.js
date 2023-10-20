const Tasks = require('../models/tasks');
const User = require('../models/user');
const Users = require('../models/user');

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router()

const { Sequelize, DataTypes, Model } = require('sequelize');


module.exports = router;

const allowedStatuses = [ 'open', 'closed', 'in_dev', 'blocked', 'in_qa' ];
const allowedTypes = [ 'feature', 'bugfix', 'hotfix' ];

function verifyJWT(req, res, next){
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, msg: 'No token provided.' });
    
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        if (err) return res.status(500).json({ auth: false, msg: 'Failed to authenticate token.' });

        req.authenticatedUserId = decoded.id;
        next();
    });
}

router.post('/create', verifyJWT, async (req, res) => {
    try{

        var typeValidation = validateTaskType(req.body.type)
        if (!typeValidation) return res.status(400).json({ auth: false, msg: "Invalid task type: must be one of 'feature' 'bugfix' 'hotfix'" });

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
        var tasks = {};
        var filters = {};

        if (JSON.stringify(req.query) !== '{}') {
            if (req.query.type) {
                if (!validateTaskType(req.query.type)) return res.status(400).json({ success: false, msg: "Invalid task type: must be one of 'feature' 'bugfix' 'hotfix'" });
                filters.type = req.query.type;
            }
    
            if (req.query.status) {
                if (!validateTaskStatus(req.query.status)) return res.status(400).json({ success: false, msg: "Invalid task status: must be one of 'open' 'closed' 'in_dev' 'blocked' 'in_qa'" });
                filters.status = req.query.status;
            }
    
            if (req.query.created_by) {
                var user = await Users.findOne({
                    where: {
                        id: req.query.created_by
                    }
                });
                if (!user) return res.status(404).json({ success: false, msg: 'USER_NOT_FOUND' });
                filters.createdBy = req.query.created_by;
            }

            if (req.query.created_by) filters.createdBy = req.query.created_by;
        }

        tasks = await Tasks.findAll({
            where: filters,
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
            }]
        });

        if (!task) return res.status(404).json({ success: false, msg: 'TASK_NOT_FOUND' });

        res.send({ success: true, data: task })
    } catch(error){
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.put('/update/:taskId', verifyJWT, async (req, res) => {
    try {
        const taskId = req.params.taskId;

        var task = await Tasks.findOne({
            where: {
                id: taskId
            }
        });
        if (!task) return res.status(404).json({ success: false, msg: 'TASK_NOT_FOUND' });

        if (task.status == "closed") {
            return res.status(400).json({ success: false, msg: "Invalid operation: cannot update a closed task" });
        }

        if (req.body.hasOwnProperty('status')) {
            if (req.body.status == "closed") return res.status(400).json({ success: false, msg: "Invalid operation: use PUT /api/task/close/{id} to close a task" });
        }

        if (req.body.hasOwnProperty('type')) {
            if (!validateTaskType(req.body.type)) return res.status(400).json({ success: false, msg: "Invalid task type: must be one of 'feature' 'bugfix' 'hotfix'" });
        }

        if (req.body.hasOwnProperty('status')) {
            if (!validateTaskStatus(req.body.status)) return res.status(400).json({ success: false, msg: "Invalid task status: must be one of 'open' 'closed' 'in_dev' 'blocked' 'in_qa'" });
        }

        const newData = {};

        if (req.body.title) newData.title = req.body.title
        if (req.body.description) newData.description = req.body.description
        if (req.body.type) newData.type = req.body.type
        if (req.body.status) newData.status = req.body.status

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
        if (!task) return res.status(404).json({ success: false, msg: 'TASK_NOT_FOUND' });

        if (task.status == "closed") {
            return res.status(400).json({ success: false, msg: "Invalid operation: cannot close a closed task" });
        }

        await Tasks.update( {
            status: "closed",
            closedOn: new Date(),
            closedBy: req.authenticatedUserId
        }, {
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

function validateTaskType(taskType)
{
    return allowedTypes.includes(taskType)
}

function validateTaskStatus(taskStatus)
{
    return allowedStatuses.includes(taskStatus);
}