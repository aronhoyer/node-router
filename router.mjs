/**
 * @typedef {import('node:http').IncomingMessage & { params: Object.<string, string|number> }} Request
 * @typedef {import('node:http').ServerResponse<Request>} Response
 *
 * @callback Handler
 * @param {Request}
 * @param {Response}
 *
 * @typedef {Object} Param
 * @prop {string} key
 * @prop {number} position
 *
 * @typedef {Object} Route
 * @prop {string} path
 * @prop {Param[]} params
 * @prop {Object.<string, Handler>} handlers
 */

import { normalisePath } from './util.mjs'

export class Router {
    /** @type {Object.<string, Route> */
    #routes = {}

    constructor() {
        this.requestListener = this.requestListener.bind(this)
    }

    /**
     * @param {string} path @param {Handler} handler
     * @param {string} method
     */
    #registerRoute(method, path, handler) {
        if (path in this.#routes) {
            if (method in this.#routes[path].handlers) {
                throw new Error(`${method} handler is already registered for ${path}`)
            }

            this.#routes[path].handlers[method] = handler
        } else {
            this.#routes[path] = {
                handlers: {
                    [method]: handler,
                },
                params: this.#getParamKeys(path),
                path: normalisePath(path),
            }
        }
    }

    /**
     * @param {string} path
     */
    #getParamKeys(path) {
        return path
            .split('/')
            .filter(Boolean)
            .map((p) => p.startsWith(':') ? p.slice(1) : null)
            .reduce((params, key, i) => key ? [...params, { key, position: i }] : params, [])
    }

    /**
     * @param {Param[]} params
     * @param {string} url
     * @returns {Object.<string, string|number>}
     */
    #getParamValues(params, url) {
        const urlParts = url.split('/').filter(Boolean)
        return params.reduce((ps, p) => ({
            ...ps,
            [p.key]: urlParts[p.position],
        }), {})
    }

    /**
     * @param {Route} route
     * @param {string} url
     * @returns {boolean}
     */
    #pathMatches(route, url) {
        if (route.path === url) {
            return true
        }

        const pathParts = route.path.split('/').filter(Boolean)
        const urlParts = url.split('/').filter(Boolean)

        if (pathParts.length !== urlParts.length) {
            return false
        }

        const matchingParts = []

        for (let i = 0; i < urlParts.length; i++) {
            const part = urlParts[i];

            if (pathParts[i].startsWith(':')) {
                const matchingParam = route.params.find((param) => param.position === i)
                matchingParts.push(!!matchingParam)
            } else {
                matchingParts.push(part === pathParts[i])
            }
        }

        return matchingParts.every(Boolean)
    }

    /**
     * @type {Handler}
     */
    notFoundHandler(req, res) {
        res.statusCode = 404
        res.end()
    }

    /**
     * @type {Handler}
     */
    methodNotAllowedHandler(req, res) {
        res.statusCode = 405
        res.end()
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    DELETE(path, handler) {
        this.#registerRoute('DELETE', path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    GET(path, handler) {
        this.#registerRoute('GET', path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    PATCH(path, handler) {
        this.#registerRoute('PATCH', path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    POST(path, handler) {
        this.#registerRoute('POST', path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    PUT(path, handler) {
        this.#registerRoute('PUT', path, handler)
    }

    /**
     * @param {import('node:http').IncomingMessage} req
     * @param {import('node:http').ServerResponse} res
     */
    requestListener(req, res) {
        /** @type {Handler} */
        let handler

        let params = {}

        for (const path in this.#routes) {
            if (this.#routes.hasOwnProperty(path)) {
                const route = this.#routes[path]

                if (this.#pathMatches(route, req.url)) {
                    if (route.handlers[req.method]) {
                        handler = this.#routes[path].handlers[req.method]
                        params = this.#getParamValues(route.params, req.url)
                    } else {
                        handler = this.methodNotAllowedHandler
                    }

                    break
                } else {
                    handler = this.notFoundHandler
                }
            }
        }

        handler.call(this, Object.assign(req, { params }), res)
    }
}
