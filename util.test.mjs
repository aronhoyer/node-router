import assert from "node:assert"
import { describe, it } from "node:test"

import { normalisePath } from "./util.mjs"

describe('util', () => {
    describe('normalisePath', () => {
        it('normalises path with leading and without trailing slash', () => {
            assert.strictEqual(normalisePath("/a/b/c"), "/a/b/c")
        })

        it('normalises path without leading or trailing slash', () => {
            assert.strictEqual(normalisePath("a/b/c"), "/a/b/c")
        })

        it('normalises path with leading and trailing slash', () => {
            assert.strictEqual(normalisePath("/a/b/c/"), "/a/b/c")
        })
        it('normalises path without leading and with trailing slash', () => {
            assert.strictEqual(normalisePath("a/b/c/"), "/a/b/c")
        })
    })
})
