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

        const Task = require('./task');
        const existingUser = await this.constructor.findById(this._id);

        const oldTaskIds = existingUser ? existingUser.pendingTasks.map(String) : [];
        const newTaskIds = this.pendingTasks.map(String);

        const removedTaskIds = oldTaskIds.filter(id => !newTaskIds.includes(id));
        const addedTaskIds = newTaskIds.filter(id => !oldTaskIds.includes(id));
        
        // Name change for user
        if (existingUser && existingUser.name !== this.name) {
            const assignedTasks = await Task.find({ assignedUser: this._id.toString() });
            for (const task of assignedTasks) {
                task.assignedUserName = this.name;
                task.__updateFromUser = true;
                await task.save();
            }
        }

        // Remove tasks that aren't in the new tasks
        if (removedTaskIds.length > 0) {
            const oldTasks = await Task.find({ _id: { $in: removedTaskIds } });
            for (const task of oldTasks) {
                if (task.assignedUser === this._id.toString()) {
                    task.assignedUser = '';
                    task.assignedUserName = 'unassigned';
                    task.__updateFromUser = true;
                    await task.save();
                }
            }
        }

        // Add tasks that aren't in the old tasks
        if (addedTaskIds.length > 0) {
            const newTasks = await Task.find({ _id: { $in: addedTaskIds } });
            for (const task of newTasks) {
                if (task.assignedUser !== this._id.toString()) {
                    task.assignedUser = this._id.toString();
                    task.assignedUserName = this.name;
                    task.__updateFromUser = true;
                    await task.save();
                }
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
