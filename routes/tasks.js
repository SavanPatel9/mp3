const Task = require('../models/task')
const User = require('../models/user')

module.exports = function (router) {

    router.route('/tasks')
        .get(async (req, res) => {
            try {
                let where = {};
                let sort = {};
                let select = {};
                let skip = 0;
                let limit = 100;
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
                    const total = await Task.countDocuments(where);
                    return res.status(200).json({
                        message: 'Count of matching tasks',
                        data: total
                    });
                }

                const tasks = await Task.find(where)
                                        .sort(sort)
                                        .select(select)
                                        .skip(skip)
                                        .limit(limit)
                                        .exec();

                res.status(200).json({
                    message: "OK.",
                    data: tasks
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
                const { name, deadline } = req.body;
                if (!name || !deadline) return res.status(400).json({ message: 'Name and deadline are required.', data: null });
                
                const data = { ...req.body};
                
                if (data.assignedUser) {
                    const user = await User.findById(data.assignedUser);

                    if (!user) {
                        return res.status(404).json({ message: 'User not found, invalid assignment.', data: null });
                    }
                    else if (!data.assignedUserName) {
                        return res.status(400).json({ message: 'No username provided with ID.', data: null });
                    }
                    else if (user.name !== data.assignedUserName) {
                        return res.status(400).json({ message: 'Username invalid.', data: null });
                    }
                }
                else {
                    delete data.assignedUser;
                    delete data.assignedUserName;
                }

                const task = new Task(data);
                await task.save();
                res.status(201).json({
                    message: "Task Created.",
                    data: task
                });
            }
            catch (err) {
                res.status(500).json({
                    message: err.message,
                    data: null
                });
            }
        });

    router.route('/tasks/:id')
        .get(async (req, res) => {
            try {
                let select = {};
                if (req.query.select) {
                    try { select = JSON.parse(req.query.select); }
                    catch { return res.status(400).json({ message: 'Invalid JSON in "select" parameter', data: null }); }
                }

                const task = await Task.findById(req.params.id).select(select);
                if (!task) {
                    return res.status(404).json({ message: 'Task not found', data: null });
                }
                
                res.status(200).json({
                    message: "OK.",
                    data: task
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
                const { name, deadline } = req.body;
                if (!name || !deadline) return res.status(400).json({ message: 'Name and deadline are required.', data: null });
                
                const data = { ...req.body};
                
                if (data.assignedUser) {
                    const user = await User.findById(data.assignedUser);

                    if (!user) {
                        return res.status(404).json({ message: 'User not found, invalid assignment.', data: null });
                    }
                    else if (!data.assignedUserName) {
                        return res.status(400).json({ message: 'No username provided with ID.', data: null });
                    }
                    else if (user.name !== data.assignedUserName) {
                        return res.status(400).json({ message: 'Username invalid.', data: null });
                    }
                }
                else {
                    delete data.assignedUser;
                    delete data.assignedUserName;
                }

                const task = await Task.findById(req.params.id);
                if (!task) return res.status(404).json({ message: 'Task not found', data: null });

                Object.assign(task, data);
                await task.save();

                res.status(200).json({
                    message: "Task Updated.",
                    data: task
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
                const task = await Task.findById(req.params.id);
                if (!task) return res.status(404).json({ message: 'Task not found', data: null });

                await task.deleteOne();

                res.status(200).json({
                    message: 'User deleted',
                    data: task
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