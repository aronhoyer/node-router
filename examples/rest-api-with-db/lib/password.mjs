import crypto from 'crypto'
import util from 'util'

const pkdf2 = util.promisify(crypto.pbkdf2)

function getSecret() {
    return 'keyboardcat'
}

async function hash(pwd) {
    const buf = await pkdf2(pwd, getSecret(), 4096, 64, 'sha512')
    return buf.toString('hex')
}

async function verify(hashed, clear) {
    const h = await hash(clear)
    return hashed === h
}

export default {
    hash,
    verify,
}
