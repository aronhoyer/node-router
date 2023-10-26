/**
 * @param {typeof process.env} env
 */
function verify() {
    const missingVars = [
        'DB_CONNECTION',
        'DB_NAMESPACE',
        'DB_NAME',
    ].map((v) => !process.env[v] ? v : null).filter(Boolean)

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missingVars.join(', ')}`)
    }
}

function get(key) {
    return process.env[key]
}

export default {
    get,
    verify,
}
