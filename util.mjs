export function normalisePath(path) {
    let p = path

    if (!p.startsWith('/')) {
        p = '/' + p
    }

    if (p.endsWith('/')) {
        p = p.slice(0, p.length - 1)
    }
    
    return p
}
