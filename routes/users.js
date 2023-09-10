const Users = require('../model/users');

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router()
const bcrypt = require('bcrypt');

module.exports = router;

router.post('/register', async (req, res) => {
    try{
        //const userCheck = await Users.findOne({ email: req.body.email });
        //if (userCheck) return res.status(400).json({ success: false, msg: 'E-mail already in use' });

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const User = await Users.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })

        //const userToSave = await user.save();
        res.status(200).json({ success: true, data: User })
    } catch(error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

router.post('/login', async (req, res) => {
    try{
        const user = await Users.findOne({ where: {email: req.body.username} });
        if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ success: false, msg: 'Login invalid' });

        const accessToken = jwt.sign(JSON.stringify(user), process.env.TOKEN_SECRET)
        res.json({ success: true, token: accessToken });
    } catch(error) {
        res.status(400).json({ success: false, msg: error.message })
    }
})