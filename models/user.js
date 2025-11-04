// Load required packages
var mongoose = require('mongoose');
const task = require('./task');

// Define our user schema
var UserSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    email: {type: String, required: true, unique: true, trim: true},
    pendingTasks: [{type: String}],
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

UserSchema.pre('save', async function (next) {
    try {
        if (this.__updateFromTask) {
            return next();
        }

        const Task = require("./task");
        const taskIds = this.pendingTasks.map(id => new mongoose.Types.ObjectId(id));
        const tasks = await Task.find({ _id: { $in: taskIds } });

        for (const task of tasks) {
            if (task.assignedUser !== this._id.toString()) {
                task.assignedUser = this._id.toString();
                task.assignedUserName = this.name;
                task.__updateFromUser = true;
                await task.save();
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

UserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const Task = require("./task");
        const taskIds = this.pendingTasks.map(id => new mongoose.Types.ObjectId(id));
        const tasks = await Task.find({ _id: { $in: taskIds } });

        for (const task of tasks) {
            if (task.assignedUser !== this._id.toString()) {
                task.assignedUser = '';
                task.assignedUserName = 'unassigned';
                task.__updateFromUser = true;
                await task.save();
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
