// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var TaskSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    description: {type: String, default: ''},
    deadline: {type: Date, required: true},
    completed: {type: Boolean, default: false},
    assignedUser: { 
        type: String,
        default: ''
    },
    assignedUserName: {
        type: String,
        default: 'unassigned'
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

TaskSchema.pre('save', async function (next) {
    try {
        if (this.__updateFromUser) {
            return next();
        }

        const User = require("./user");

        if (this.isModified('assignedUser')) {
            const existing = await this.constructor.findById(this._id);
            if (existing && existing.assignedUser && existing.assignedUser !== '') {
                const oldUser = await User.findById(existing.assignedUser);
                if (oldUser) {
                    oldUser.pendingTasks = oldUser.pendingTasks.filter(
                        t => t !== this._id.toString()
                    );
                    oldUser.__updateFromTask = true;
                    await oldUser.save();
                }
            }

            if (this.assignedUser !== '') {
                const newUser = await User.findById(this.assignedUser);
                if (newUser && !newUser.pendingTasks.includes(this._id.toString())) {
                    newUser.pendingTasks.push(this._id.toString());
                    newUser.__updateFromTask = true;
                    await newUser.save();
                }
            }
        }

        next();
    }
    catch (err) {
        next(err);
    }
});

TaskSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        if (this.assignedUser !== '') {
            const User = require('./user');
            const user = await User.findById(this.assignedUser);
            if (user) {
                user.pendingTasks = user.pendingTasks.filter(
                    id => id.toString() !== this._id.toString()
                );
                user.__updateFromTask = true;
                await user.save();
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);