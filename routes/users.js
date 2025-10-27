const User = require('../models/user')

module.exports = function (router) {

    router.route('/users')
        .get(async (req, res) => {
            try {
                const users = await User.find();
                res.status(200).json({data: users});
            }
            catch (err) {
                res.status(500).json({error: err.message});
            }
        })
        .post(async (req, res) => {
            try {
                const user = new User(req.body);
                await user.save();
                res.status(201).json({data: user});
            }
            catch (err) {
                res.status(400).json({error: err.message});
            }
        });
    
    router.route('/users/:id')
        .get(async (req, res) => {
            try {
                const user = await User.findById(req.params.id);
                if (!user) {
                    res.status(404).json({ error: 'Task not found' });
                }
                else {
                    res.status(200).json({data: user});
                }
            }
            catch (err) {
                res.status(500).json({error: err.message});
            }
        })
        .put(async (req, res) => {
            try {
                const user = await User.findById(req.params.id);
                if (!user) {
                    res.status(404).json({ error: 'Task not found' });
                }
                else {
                    Object.assign(user, req.body);
                    await user.save();
                    res.status(200).json({data: user});
                }
            }
            catch (err) {
                res.status(500).json({ error: err.message });
            }
        })
        .delete(async (req, res) => {
            try {
                const user = await User.findByIdAndDelete(req.params.id);
                if (!user) {
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