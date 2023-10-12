import assert from "node:assert"
import http from "node:http"
import { after, before, describe, it } from "node:test"

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
                res.end()
            })

            router.GET("/books/:id", (req, res) => {
                res.setHeader("content-type", "text/plain")
                res.end(req.params.id)
            })

            router.GET("/books/:id/reviews", (req, res) => {
                res.end()
            })

            server = http.createServer(router.requestListener)

            server.listen(42069)
        }
    })

    after(() => {
        server.close()
    })

    it("responds 404", async () => {
        const res = await request("http://127.0.0.1:42069/404")
        console.log(res.statusCode)
        assert.strictEqual(res.statusCode, 404)
    })

    it("responds 405", async () => {
        const res = await request("http://127.0.0.1:42069/getroute", { method: "POST" })
        assert.strictEqual(res.statusCode, 405)
    })

    it("responds 200", async () => {
        const res = await request("http://127.0.0.1:42069/getroute")
        assert.strictEqual(res.statusCode, 200)
    })

    it("responds 200 on parameterised route", async (t) => {
        await t.test("trailing param", async () => {
            const res = await request("http://127.0.0.1:42069/books/abc123")
            assert.strictEqual(res.statusCode, 200)
        })

        await t.test("non-trailing param", async () => {
            const res = await request("http://127.0.0.1:42069/books/abc123/reviews")
            assert.strictEqual(res.statusCode, 200)
        })
    })

    it("sets params", async () => {
        const id = "abc123"
        const res = await request(`http://127.0.0.1:42069/books/${id}`)
        assert.strictEqual(res.body, id)
    })
})
