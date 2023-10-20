require('dotenv').config();

const tasksRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');
const cors = require('cors');

const express = require('express');
const app = express();
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use('/api/task', tasksRoutes)
app.use('', usersRoutes)
app.listen(3000, (req, res) => {
    console.log(`Server Started at ${3000}`)
})
