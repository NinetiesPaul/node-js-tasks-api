const Tasks = require('../model/tasks');

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router()

module.exports = router;

function verifyJWT(req, res, next){
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, msg: 'No token provided.' });
    
    jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        if (err) return res.status(500).json({ auth: false, msg: 'Failed to authenticate token.' });

        req.authenticatedUserId = decoded._id;
        next();
    });
}

router.post('/task', verifyJWT, async (req, res) => {
    try{
        const task = new Tasks({
            title: req.body.title,
            description: req.body.description,
            type: req.body.type,
            status: req.body.status,
            ownerId: req.authenticatedUserId
        })
        
        const taskToSave = await task.save();
        res.status(200).json({ success: true, data: taskToSave })
    } catch(error) {
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.get('/tasks', verifyJWT, async (req, res) => {
    try{
        const filterByOwner = req.query.owner;
        const filterByStatus = req.query.status;
        const filterByType = req.query.type;

        var filters = {};
        var tasks = {};

        if (JSON.stringify(req.query) === '{}') {
            tasks = await Tasks.find();
        } else {
            if (filterByOwner) filters.ownerId = filterByOwner;
            if (filterByStatus) filters.status = filterByStatus;
            if (filterByType) filters.type = filterByType;

            tasks = await Tasks.find(filters);
        }
        
        res.json({ success: true, result: { total: tasks.length, data: tasks } })
    } catch(error){
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.get('/task/:taskId', verifyJWT, async (req, res) => {
    try{
        const taskId = req.params.taskId;

        const task = await Tasks.findById(taskId);
        if (!task) return res.status(404).json({ success: false, msg: 'Task not found with given id ' + taskId });

        res.send({ success: true, data: task })
    } catch(error){
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.patch('/task/:taskId', verifyJWT, async (req, res) => {
    try {
        const taskId = req.params.taskId;

        const updatedData = req.body;
        const options = { new: true };

        const task = await Tasks.findByIdAndUpdate( taskId, updatedData, options )
        if (!task) return res.status(404).json({ success: false, msg: 'Task not found with given id ' + taskId });

        res.send({ success: true, data: task })
    } catch (error) {
        res.status(400).json({ success: false, msg: error.message })
    }
})

router.delete('/task/:taskId', verifyJWT, async (req, res) => {
    try {
        const taskId = req.params.taskId;

        const task = await Tasks.findByIdAndDelete(taskId)
        if (!task) return res.status(404).json({ success: false, msg: 'Task not found with given id ' + taskId });

        res.send({ success: true, msg: "Task with id " + taskId + " was deleted"})
    } catch (error) {
        res.status(400).json({ success: false, msg: error.message })
    }
})