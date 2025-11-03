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
        const Task = require("./task");
        if (this.isModified('name') && this.pendingTasks.length > 0) {
            const taskIds = this.pendingTasks.map(id => new mongoose.Types.ObjectId(id));
            await Task.updateMany(
                { _id: { $in: taskIds } },
                { $set: { assignedUserName: this.name } }
            );
        }
        next();
    } catch (err) {
        next(err);
    }
});

UserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const Task = require("./task");
        await Task.updateMany(
            { assignedUser: this._id.toString() },
            { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
        );
        next();
    } catch (err) {
        next(err);
    }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
