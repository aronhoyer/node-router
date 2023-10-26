import crypto from 'crypto'
import http from 'http'

import { Router } from '../../router.mjs'
import { Surreal } from 'surrealdb.node'

import env from './lib/env.mjs'
import { createUserHandler } from './handlers/createUser.mjs'
import { getUserHandler } from './handlers/getUser.mjs'

const router = new Router()
const server = http.createServer(router.requestListener)

const db = new Surreal()

try {
    env.verify(process.env)

    await db.connect(env.get('DB_CONNECTION'))
    await db.use({ ns: env.get('DB_NAMESPACE'), db: env.get('DB_NAME') })

    router.notFoundHandler = (req, res) => {
        res.statusCode = 404
        res.end(JSON.stringify({ error: `${req.url} not found` }))
    }

    router.methodNotAllowedHandler = (req, res) => {
        res.statusCode = 405
        res.end(JSON.stringify({ error: `${req.method} is not allowed for ${req.url}` }))
    }

    router.GET('/ping', (req, res) => {
        res.end('pong')
    })

    router.POST('/users', createUserHandler(db))

    router.GET('/users/:username', getUserHandler(db))

    server.on('listening', () => {
        console.log('Server listening on :42069')
    })

    server.on('request', (req, res) => {
        const start = Date.now()

        res.on('finish', () => {
            console.log(req.method, req.url, res.statusCode, `${Date.now() - start} ms`)
        })
    })

    server.listen(42069)
} catch (error) {
    console.error(error)
    process.exit(1)
}
