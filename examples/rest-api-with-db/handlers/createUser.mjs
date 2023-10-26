import crypto from 'crypto'

import password from '../lib/password.mjs'

export function createUserHandler(db) {
    return function(req, res) {
        let data = ''

        req.on('data', (c) => {
            data += c
        }).on('end', async () => {
                res.setHeader('content-type', 'application/json')

                data = JSON.parse(data)

                console.log(data)

                try {
                    const user = {
                        ...data,
                        password: await password.hash(data.password),
                        created_at: Date.now(),
                        updated_at: Date.now(),
                    }

                    user.hash = crypto.createHash('md5').update(JSON.stringify({
                        email: user.email,
                        password: user.password,
                        username: user.username,
                    })).digest('hex')

                    const created = await db.create('user', user)

                    res.statusCode = 201
                    res.end(JSON.stringify(created[0]))
                } catch (error) {
                    console.error(error)
                    res.statusCode = 500
                    res.end(JSON.stringify({ error }))
                }
            })
    }
}
