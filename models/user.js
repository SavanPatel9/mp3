// Load required packages
var mongoose = require('mongoose');
const task = require('./task');

// Define our user schema
var UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    pendingTasks: [String],
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

UserSchema.pre('save', async function (next) {
    try {
        const Task = require("./task");
        const taskIds = this.pendingTasks.map(id => new mongoose.Types.ObjectId(id));
        const tasks = await Task.find({ _id: { $in: taskIds } });

        for (const task of tasks) {
            task.assignedUserName = this.name;
        }

        await Task.bulkSave(tasks);
        next();
    }
    catch (err) {
        next(err);
    }
});

UserSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const Task = require("./task");
        const taskIds = this.pendingTasks.map(id => new mongoose.Types.ObjectId(id));
        const tasks = await Task.find({ _id: { $in: taskIds } });

        for (const task of tasks) {
            task.assignedUser = '';
            task.assignedUserName = 'unassigned';
        }

        await Task.bulkSave(tasks);
        next();
    }
    catch (err) {
        next(err);
    }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
