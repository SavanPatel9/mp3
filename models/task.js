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
    const User = require("./user");
    // Find existing task (if this is an update)
    if (this._id) {
        const existing = await this.constructor.findById(this._id);
        if (existing && existing.assignedUser && existing.assignedUser !== this.assignedUser) {
            // Remove from old user's pendingTasks
            await User.findByIdAndUpdate(existing.assignedUser, { $pull: { pendingTasks: this._id.toString() } });
        }
    }

    // Update assignedUserName
    if (this.assignedUser) {
        const user = await User.findById(this.assignedUser);
        if (user) this.assignedUserName = user.name;
        else {
            this.assignedUser = '';
            this.assignedUserName = 'unassigned';
        }
    } else {
        this.assignedUserName = 'unassigned';
    }

    next();
});

TaskSchema.post('save', async function (doc) {
    if (doc.assignedUser) {
        const User = require("./user");
        await User.findByIdAndUpdate(doc.assignedUser, {
            $addToSet: { pendingTasks: doc._id.toString() }
        });
    }
});

TaskSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    if (this.assignedUser) {
        const User = require("./user");
        await User.findByIdAndUpdate(this.assignedUser, {
            $pull: { pendingTasks: this._id.toString() }
        });
    }
    next();
});

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);