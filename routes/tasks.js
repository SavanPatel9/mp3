const Task = require('../models/task')

module.exports = function (router) {

    router.route('/tasks')
        .get(async (req, res) => {
            try {
                const tasks = await Task.find();
                res.status(200).json({data: tasks});
            }
            catch (err) {
                res.status(500).json({error: err.message});
            }
        })
        .post(async (req, res) => {
            try {
                const task = new Task(req.body);
                await task.save();
                res.status(201).json({data: task});
            }
            catch (err) {
                console.log(err.message);
                res.status(400).json({error: err.message});
            }
        });

    router.route('/tasks/:id')
        .get(async (req, res) => {
            try {
                const task = await Task.findById(req.params.id);
                if (!task) {
                    res.status(404).json({ error: 'Task not found' });
                }
                else {
                    res.status(200).json({data: task});
                }
            }
            catch (err) {
                res.status(500).json({error: err.message});
            }
        })
        .put(async (req, res) => {
            try {
                const task = await Task.findById(req.params.id);
                if (!task) {
                    res.status(404).json({ error: 'Task not found' });
                }
                else {
                    Object.assign(task, req.body);
                    await task.save();
                    res.status(200).json({data: task});
                }
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        })
        .delete(async (req, res) => {
            try {
                const task = await Task.findByIdAndDelete(req.params.id);
                if (!task) {
                    res.status(404).json({ error: 'User not found' });
                }
                else {
                    res.status(200).json({ message: 'User deleted' });
                }
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

    return router;
}