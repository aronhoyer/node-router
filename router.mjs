/**
 * @typedef {Object} Param
 * @prop {string} key
 * @prop {number} position
 *
 * @typedef {import("node:http").IncomingMessage & { params: Object.<string, string|number> }} Request
 * @typedef {import("node:http").ServerResponse} Response
 *
 * @callback Handler
 * @param {Request} req
 * @param {Response} res
 *
 * @typedef Route
 * @prop {Handler} handler
 * @prop {Param[]} params
 * @prop {string} path
 *
 * @typedef {Object.<string, Object.<string, Route>>} Tree
 */

export class Router {
    /** @type {Tree} */
    #tree = {}

    constructor() {
        this.requestListener = this.requestListener.bind(this)
    }

    /**
     * @param {string} method
     * @param {string} path
     * @param {Handler} handler
     */
    #registerRoute(method, path, handler) {
        if (!this.#tree[path]) {
            this.#tree[path] = {}
        }

        if (this.#tree[path][method]) {
            throw new Error(`A ${method} is already registered for ${path}`)
        }

        this.#tree[path][method] = {
            handler,
            path,
            params: this.#getParamKeys(path),
        }
    }

    /**
     * @param {string} path
     * @returns {Param[]}
     */
    #getParamKeys(path) {
        const parts = path.split("/").filter(Boolean)

        /** @type {Param[]} */
        const params = []

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (part.startsWith(":")) {
                params.push({
                    key: part.slice(1),
                    position: i,
                })
            }
            
        }

        return params
    }
    
    /**
     * @param {Route} route
     * @param {string} url
     * @returns {Object.<string, string|number>}
     */
    #getParams(route, url) {
        /** @type {Object.<string, string|number>} */
        const params = {}

        if (!route.params) {
            return params
        }

        const urlParts = url.split("/").filter(Boolean)

        for (let i = 0; i < route.params.length; i++) {
            const param = route.params[i]
                Object.assign(params, {
                    [param.key]: urlParts[param.position],
                })
        }

        return params
    }

    /**
     * @param {Route} route
     * @param {string} url
     * @returns {boolean}
     */
    #pathMatches(route, url) {
        if (!route.path.includes(":")) {
            return route.path === url
        }

        const pathParts = route.path.split("/").filter(Boolean)
        const urlParts = url.split("/").filter(Boolean)

        if (pathParts.length !== urlParts.length) {
            return false
        }

        /** @type {boolean[]} */
        let matches = []

        for (let i = 0; i < urlParts.length; i++) {
            const part = urlParts[i]
            if (part === pathParts[i]) {
                matches.push(true)
            } else {
                for (let j = 0; j < route.params.length; j++) {
                    const param = route.params[j];
                    matches.push(param.position === i)
                }
            }
        }

        return matches.every((m) => m)
    }

    /**
     * @param {Request} req
     * @returns {Route}
     */
    #getRoute(req) {
        /** @type {Route} */
        let match = {
            handler: this.notFoundHandler,
        }

        for (const path in this.#tree) {
            if (this.#tree.hasOwnProperty(path)) {
                const node = this.#tree[path]

                if (req.method in node) {
                    if (this.#pathMatches(node[req.method], req.url)) {
                        match = node[req.method]
                    }
                } else {
                    match = {
                        handler: this.methodNotAllowedHandler,
                    }
                }
            }
        }

        return match
    }

    /**
     * @param {Request} req
     * @param {Response} res
     */
    notFoundHandler(req, res) {
        res.statusCode = 404
        res.end()
    }

    /**
     * @param {Request} req
     * @param {Response} res
     */
    methodNotAllowedHandler(req, res) {
        res.statusCode = 405
        res.end()
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    GET(path, handler) {
        this.#registerRoute("GET", path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    POST(path, handler) {
        this.#registerRoute("POST", path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    PUT(path, handler) {
        this.#registerRoute("PUT", path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    DELETE(path, handler) {
        this.#registerRoute("DELETE", path, handler)
    }

    /**
     * @param {string} path
     * @param {Handler} handler
     */
    PATCH(path, handler) {
        this.#registerRoute("PATCH", path, handler)
    }

    /**
     * @param {import("node:http").IncomingMessage} req
     * @param {import("node:http").ServerResponse} res
     */
    requestListener(req, res) {
        const route = this.#getRoute(req)
        const params = this.#getParams(route, req.url)

        const request = Object.assign(req, { params })
        route.handler.call(this, request, res)
    }
}
