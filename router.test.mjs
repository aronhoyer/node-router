import assert from "node:assert"
import http from "node:http"
import querystring from 'node:querystring'
import { after, before, describe, test } from "node:test"

import { Router } from "./router.mjs"

/**
 * @typedef {http.IncomingMessage & { body: string }} Response
 *
 * @param {string} url
 * @param {http.RequestOptions} opts
 * @returns {Promise<Response>}
 */
const request = (url, opts) => {
    return new Promise((resolve, reject) => {
        const req = http.request(url, opts)
        req.on("error", reject)
        req.on("response", (res) => {
            let data = ""

            res.on("data", (c) => {
                data += c
            }).on("end", () => {
                resolve({ ...res, body: data })
            })
        })

        req.end()
    })
};

describe("Router", () => {
    /** @type {import("node:http").Server|undefined} */
    let server;

    before(() => {
        if (!server) {
            const router = new Router()

            router.GET("/getroute", (req, res) => {
                let body
                if (req.query) {
                    body = querystring.stringify(req.query)
                }
                res.end(body)
            })

            router.POST("/books", (req, res) => {
                res.end()
            });
            
            router.GET("/books/:id", (req, res) => {
                res.setHeader("content-type", "text/plain")
                res.end(req.params.id)
            })

            router.GET("/books/:id/reviews", (req, res) => {
                res.end()
            })

            router.GET('/dist/*.css', (req, res) => {
                res.setHeader("content-type", "text/plain")
                res.end(req.filename)
            })

            server = http.createServer(router.requestListener)

            server.listen(42069)
        }
    })

    after(() => {
        server.close()
    })

    test("GET /404 responds 404", async () => {
        const res = await request("http://127.0.0.1:42069/404")
        assert.strictEqual(res.statusCode, 404)
    })

    test("POST /getroute responds 405", async () => {
        const res = await request("http://127.0.0.1:42069/getroute", { method: "POST" })
        assert.strictEqual(res.statusCode, 405)
    })

    test("responds 200", async (t) => {
        await t.test("GET /getroute", async () => {
            const res = await request("http://127.0.0.1:42069/getroute")
            assert.strictEqual(res.statusCode, 200)
        })

        await t.test("POST /books", async () => {
            const res = await request("http://127.0.0.1:42069/books", { method: "POST" })
            assert.strictEqual(res.statusCode, 200)
        })
    })

    test("parameterised path", async (t) => {
        await t.test("GET /books/:id responds 200", async () => {
            const res = await request("http://127.0.0.1:42069/books/abc123")
            assert.strictEqual(res.statusCode, 200)
        })

        await t.test("GET /books/:id/reviews responds 200", async () => {
            const res = await request("http://127.0.0.1:42069/books/abc123/reviews")
            assert.strictEqual(res.statusCode, 200)
        })
    })

    test("params get set to req object", async () => {
        const id = "abc123"
        const res = await request(`http://127.0.0.1:42069/books/${id}`)
        assert.strictEqual(res.body, id)
    })

    test('query gets set on req', async () => {
        const query = querystring.stringify({
            redirect_uri: 'https://example.com',
            prompt: 'consent',
            response_type: 'code',
            client_id: 'CLiOpEUVpUfw1c2n',
            scope: 'openid',
        })

        const res = await request(`http://127.0.0.1:42069/getroute?${query}`)
        assert.strictEqual(res.body, query)
    })

    test('filename gets set to req object', async () => {
        const filename = 'styles.css'
        const res = await request(`http://127.0.0.1:42069/dist/${filename}`)
        assert.strictEqual(res.body, filename)
    })
})
