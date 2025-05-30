const userController = require('../controllers/userController');

const express = require('express');
const router = express.Router()
const { check } = require('express-validator');

module.exports = router;

function userValidation()
{
    return [
        check('name').exists().withMessage('MISSING_NAME'),
        check('name').if(check('name').exists()).isString().withMessage('NAME_NOT_STRING'),
        check('name').if(check('name').exists()).notEmpty().withMessage('EMPTY_NAME'),
        check('email').exists().withMessage('MISSING_EMAIL'),
        check('email').if(check('email').exists()).isString().withMessage('EMAIL_NOT_STRING'),
        check('email').if(check('email').exists()).notEmpty().withMessage('EMPTY_EMAIL'),
        check('password').exists().withMessage('MISSING_PASSWORD'),
        check('password').if(check('password').exists()).isString().withMessage('PASSWORD_NOT_STRING'),
        check('password').if(check('password').exists()).notEmpty().withMessage('EMPTY_PASSWORD'),
    ];
}

router.post('/register', userValidation(), userController.register)

router.post('/login', userController.login)

router.get('/api/users/list', userController.listUsers)