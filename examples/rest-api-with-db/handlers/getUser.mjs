export function getUserHandler(db) {
    return async function(req, res) {
        const results = await db.query('SELECT created_at, email, hash, identifier AS id, username, updated_at FROM user WHERE username = $username', { username: req.params.username })

        if (results.length === 0) {
            res.statusCode = 404
            return res.end()
        }

        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(results[0]))
    }
}
