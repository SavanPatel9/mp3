module.exports = function (router) {

    router.get('/tasks', async (req, res) => {
        const fields = req.query;
        res.json(fields);
    });

    router.get('/tasks/:id', async (req, res) => {
        const { id } = req.params;
        const fields = req.query;
        res.json({id, fields});
    });

    return router;
}