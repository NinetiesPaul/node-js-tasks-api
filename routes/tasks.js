const taskController = require('../controllers/taskController');

const Tasks = require('../models/tasks');

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router()
const { check } = require('express-validator');

module.exports = router;

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

router.post('/create', verifyJWT, createValidation(), taskController.createTask)

router.get('/list', verifyJWT, taskController.listTasks)

router.get('/view/:taskId', verifyJWT, taskController.viewTask)

router.put('/update/:taskId', verifyJWT, updateValidation(), taskController.updateTask)

router.put('/close/:taskId', verifyJWT, taskController.closeTask)

router.post('/assign/:taskId', verifyJWT, assignmentValidation(), taskController.assignTask)

router.delete('/unassign/:assignmentId', verifyJWT, taskController.unassignTask)

router.post('/comment/:taskId', verifyJWT, commentValidation(), taskController.createComment)

router.delete('/comment/:commentId', verifyJWT, taskController.deleteComment)

/*router.delete('/delete/:taskId', verifyJWT, async (req, res) => {
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
})*/
