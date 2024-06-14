const Users = require('../models/user');

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router()
const bcryptjs = require('bcryptjs');

module.exports = router;

const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

router.post('/register', async (req, res) => {
    try{
        const user = await Users.findOne({ where: {email: req.body.email} });
        if (user) return res.status(400).json({ success: false, msg: 'E-mail already taken' });

        if (!emailRegexp.test(req.body.email)) return res.status(400).json({ success: false, msg: 'E-mail is invalid' });

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
})

router.post('/login', async (req, res) => {
    try{
        const user = await Users.findOne({ where: {email: req.body.username} });
        if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

        const match = await bcryptjs.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ success: false, msg: 'Login invalid' });

        const accessToken = jwt.sign(JSON.stringify(user), process.env.TOKEN_SECRET)
        res.json({ success: true, token: accessToken });
    } catch(error) {
        res.status(400).json({ success: false, msg: error.message })
    }
})