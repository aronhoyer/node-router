export const normalisePath = (path) => {
    const parts = path.split("/").filter(Boolean)
    return `/${parts.join("/")}`
}
