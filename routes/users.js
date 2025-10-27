module.exports = function (router) {

    router.route('/users')
        .get(async (req, res) => {
            const fields = req.query;
            res.json(fields);
        });
    
    router.route('/users/:id')
        .get(async (req, res) => {
            const { id } = req.params;
            const fields = req.query;
            res.json({id, fields});
        });

    return router;
}