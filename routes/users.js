const userController = require('../controllers/userController');

const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken');
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

router.post('/register', userValidation(), userController.register)

router.post('/login', userController.login)

router.get('/api/users/list', userController.listUsers)

router.post('/auth', verifyJWT, userController.auth)