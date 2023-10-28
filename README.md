# A simple Node.js router

This router was made as an experiment to see if I could make a router that let me raw dog more of
Node's built-in modules in a "back to monkey" type effort.

Whereas libraries like Express, Koa and Hapi are entire server frameworks, this library is a router
and nothing else. It was never meant to be something else and will never be anything else.

> [!WARNING]
> Do not use this in production code. This was a pet project and I don't plan to regularily maintain it.
> However, if you've read the source and understand it, feel free to fork it.

## Getting started

```js
import http from 'http'
import { Router } from 'router'

const router = new Router()
const server = http.createServer(router.requestListener)

server.listen(8080)
```

### Creating your first route

```js
router.GET('/hello', (req, res) => {
    res.end('Hello, World!')
})
```

### URL parameters

```js
router.GET('/books/:isbn', (req, res) => {
    const { isbn } = req.params

    const book = db.getBook(isbn)

    if (!book) {
        res.statusCode = 404
        return res.end()
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(book))
})
```

### Filename wildcards

```js
router.GET('*.css', async (req, res) => {
    const file = await readStaticFile(req.filename)

    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Content-Type', 'text/css')
    res.end(file)
})
```

### URL search parameters

> [!NOTE]
> Not yet implemented

```js
router.GET('/products/:id', async (req, res) => {
    const { gclid } = req.query

    // do evil stuff

    const productPage = await readStaticFile('product.html')
    res.end(productPage)
})
```

### Parsing request body

This router library does nothing to the request body. It's on you to parse it, which is very easy:

```js
router.POST('/tasks', (req, res) => {
    if (!req.headers['Content-Type'].includes('applications/json')) {
        res.statusCode = 400
        return res.end()
    }

    let data = ''

    req.on('data', (chunk) => {
        data += chunk
    })

    req.on('end', async () => {
        data = JSON.parse(data)

        try {
            const task = db.insertTask(data)

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 201
            res.end(JSON.stringify(task))
        } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ error })
        }
    })
})
```
