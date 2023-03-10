require('dotenv').config();

const tasksRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');

const express = require('express');
const mongoose = require('mongoose');

const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString);
const database = mongoose.connection

const app = express();

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})

app.use(express.json());
app.use('/api', tasksRoutes)
app.use('', usersRoutes)
app.listen(3000, (req, res) => {
    console.log(`Server Started at ${3000}`)
})