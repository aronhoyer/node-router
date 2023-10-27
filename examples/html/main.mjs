import http from 'http'
import fs from 'fs/promises'
import url from 'url'
import path from 'path'

import { Router } from '../../router.mjs'

const DIRNAME = path.dirname(url.fileURLToPath(import.meta.url))

const router = new Router()
const server = http.createServer(router.requestListener)

/**
 * @param {string} name
 */
const getView = async (name) => {
    return fs.readFile(path.join(DIRNAME, 'dist', `${name}.html`))
}

router.notFoundHandler = async (req, res) => {
    const html = await getView('404')
    res.statusCode = 404
    res.setHeader('content-type', 'text/html')
    res.end(html)
}

router.GET('/', async (req, res) => {
    const html = await getView('index')
    res.setHeader('content-type', 'text/html')
    res.end(html)
})

router.GET('/about', async (req, res) => {
    const html = await getView('about')
    res.setHeader('content-type', 'text/html')
    res.end(html)
})

router.GET('*.css', async (req, res) => {
    const css = await fs.readFile(path.join(DIRNAME, 'dist', req.filename))
    res.setHeader('content-type', 'text/css')
    res.setHeader('cache-control', `public, max-age=${60*60*24}`)
    res.end(css)
})

router.GET('*.js', async (req, res) => {
    const js = await fs.readFile(path.join(DIRNAME, 'dist', req.filename))
    res.setHeader('content-type', 'application/javascript')
    res.setHeader('cache-control', `public, max-age=${60*60*24}`)
    res.end(js)
})

server.listen(42069)

server.on('request', async (req, res) => {
    const start = Date.now()

    res.on('finish', () => {
        console.log(req.method, req.url, res.statusCode, `${Date.now() - start} ms`)
    })
})

server.on('listening', () => {
    console.log('Server available on :42069')
})
