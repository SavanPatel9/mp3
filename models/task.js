// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var TaskSchema = new mongoose.Schema({
    name: String,
    description: String,
    deadline: Date,
    completed: Boolean,
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

TaskSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    if (this.assignedUser !== '') {
        const User = require("./user")
        const user = await User.findById(this.assignedUser);
        if (user) {
            user.pendingTasks = user.pendingTasks.filter(task => task !== this._id.toString());
            await user.save();
        }
    }
    next();
});

TaskSchema.pre('save', async function (next) {
    if (this.assignedUser !== ''){
        const User = require("./user")
        const user = await User.findById(this.assignedUser);
        if (user) {
            this.assignedUserName = user.name;
        }
    }
    next();
});

TaskSchema.post('save', async function (doc) {
    if (doc.assignedUser !== '') {
        const User = require("./user")
        const user = await User.findById(doc.assignedUser);
        if (user && !user.pendingTasks.includes(doc._id.toString())) {
            user.pendingTasks.push(doc._id.toString());
            await user.save();
        }
    }
});

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);