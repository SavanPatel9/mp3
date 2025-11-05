const User = require('../models/user')
const Task = require('../models/task')

module.exports = function (router) {

    router.route('/users')
        .get(async (req, res) => {
            try {
                let where = {};
                let sort = {};
                let select = {};
                let skip = 0;
                let limit = Infinity;
                let count = false;

                if (req.query.where) {
                    try { where = JSON.parse(req.query.where); }
                    catch { return res.status(400).json({ message: 'Invalid JSON in "where" parameter', data: null }); }
                }

                if (req.query.sort) {
                    try { sort = JSON.parse(req.query.sort); }
                    catch { return res.status(400).json({ message: 'Invalid JSON in "sort" parameter', data: null }); }
                }

                if (req.query.select) {
                    try { select = JSON.parse(req.query.select); }
                    catch { return res.status(400).json({ message: 'Invalid JSON in "select" parameter', data: null }); }
                }

                if (req.query.skip) skip = Number(req.query.skip);
                if (req.query.limit) limit = Number(req.query.limit);
                if (req.query.count === 'true') count = true;

                if (count) {
                    const total = await User.countDocuments(where);
                    return res.status(200).json({
                        message: 'Count of matching users',
                        data: total
                    });
                }

                const users = await User.find(where)
                                        .sort(sort)
                                        .select(select)
                                        .skip(skip)
                                        .limit(limit)
                                        .exec();
                res.status(200).json({
                    message: "OK.",
                    data: users
                });
            }
            catch (err) {
                res.status(500).json({
                    message: err.message,
                    data: null
                });
            }
        })
        .post(async (req, res) => {
            try {
                const { name, email, pendingTasks = [] } = req.body;
                if (!name || !email) return res.status(400).json({ message: 'Name and email are required.', data: null});
                
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "A user with this email already exists.", data: null });
                }

                if (pendingTasks.length > 0) {
                    const Task = require('../models/task');
                    const existingTasks = await Task.find({ _id: { $in: pendingTasks } });
                    if (existingTasks.length !== pendingTasks.length) {
                        return res.status(400).json({
                            message: "One or more provided task IDs do not exist.",
                            data: null
                        });
                    }
                }

                const data = {...req.body};

                delete data.dateCreated;

                const user = new User(data);
                await user.save();
                res.status(201).json({
                    message: "User Created.",
                    data: user
                });
            }
            catch (err) {
                res.status(500).json({
                    message: err.message,
                    data: null
                });
            }
        });
    
    router.route('/users/:id')
        .get(async (req, res) => {
            try {
                let select = {};
                if (req.query.select) {
                    try { select = JSON.parse(req.query.select); }
                    catch { return res.status(400).json({ message: 'Invalid JSON in "select" parameter', data: null }); }
                }

                const user = await User.findById(req.params.id).select(select);
                if (!user) {
                    return res.status(404).json({ message: 'User not found', data: null });
                }
                
                res.status(200).json({
                    message: "OK.",
                    data: user
                });
            }
            catch (err) {
                res.status(500).json({
                    message: err.message,
                    data: null
                });
            }
        })
        .put(async (req, res) => {
            try {
                const { name, email, pendingTasks = [] } = req.body;
                if (!name || !email) return res.status(400).json({ message: 'Name and email are required.', data: null});
                
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({ message: "A user with this email already exists.", data: null });
                }

                const user = await User.findById(req.params.id);
                if (!user) return res.status(404).json({ message: 'User not found', data: null });

                if (pendingTasks.length > 0) {
                    const Task = require('../models/task');
                    const existingTasks = await Task.find({ _id: { $in: pendingTasks } });
                    if (existingTasks.length !== pendingTasks.length) {
                        return res.status(400).json({
                            message: "One or more provided task IDs do not exist.",
                            data: null
                        });
                    }
                }

                const data = {...req.body};

                delete data.dateCreated;

                Object.assign(user, data);
                await user.save();
                res.status(200).json({
                    message: "User Updated.",
                    data: user
                });
            }
            catch (err) {
                res.status(500).json({
                    message: err.message,
                    data: null
                });
            }
        })
        .delete(async (req, res) => {
            try {
                const user = await User.findById(req.params.id);
                if (!user) return res.status(404).json({ message: 'User not found', data: null });

                await user.deleteOne();
                
                res.status(200).json({ 
                    message: 'User deleted',
                    data: user 
                });
            } catch (err) {
                res.status(500).json({
                    message: err.message,
                    data: null
                });
            }
        });

    return router;
}