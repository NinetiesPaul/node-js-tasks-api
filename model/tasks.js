const mongoose = require('mongoose');

const tasksSchema = new mongoose.Schema({
    title: {
        required: true,
        type: String
    },
    description: {
        required: true,
        type: String
    },
    status: {
        required: true,
        type: String
    },
    type: {
        required: true,
        type: String
    },
    ownerId: {
        required: true,
        type: String
    },

})

module.exports = mongoose.model('Tasks', tasksSchema)