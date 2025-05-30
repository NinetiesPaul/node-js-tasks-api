const Users = require('../models/user');

const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');

const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

exports.listUsers = async (req, res) => {
    try{
        var users = await Users.findAll({
            attributes: ['id', 'name', 'email' ],
        });
        res.json({ success: true, data: { total: users.length, users: users } })
    } catch(error) {
        res.status(400).json({ success: false, msg: error.message })
    }
}

exports.login = async (req, res) => {
    try{
        const user = await Users.findOne({ where: {email: req.body.username} });
        if (!user) return res.status(404).json({ success: false, message: [ "USER_NOT_FOUND" ] });

        const match = await bcryptjs.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ success: false, message: [ "INVALID_CREDENTIALS" ] });

        const accessToken = jwt.sign({ user }, process.env.TOKEN_SECRET, { expiresIn: '600000' })
        res.json({ success: true, token: accessToken });
    } catch(error) {
        res.status(400).json({ success: false, msg: error.message })
    }
}

exports.register = async (req, res) => {
    var validator = validationResult(req);

    var errorMessages = [];
    validator.errors.forEach( errorLoop => {
        errorMessages.push(errorLoop.msg)
    });

    if (errorMessages.length > 0) return res.status(400).json({ success: false, message: errorMessages });
    try{
        const user = await Users.findOne({ where: {email: req.body.email} });
        if (user) return res.status(400).json({ success: false, message: [ "EMAIL_ALREADY_TAKEN" ] });

        if (!emailRegexp.test(req.body.email)) return res.status(400).json({ success: false, message: [ "INVALID_EMAIL" ] });

        const hashedPassword = await bcryptjs.hash(req.body.password, 10);

        const createdUser = await Users.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        var newUser = await Users.findOne({
            where: { id: createdUser.id },
            attributes: ['id', 'name', 'email' ],
        });

        res.status(200).json({ success: true, data: newUser })
    } catch(error) {
        res.status(400).json({ success: false, message: error.message })
    }
}