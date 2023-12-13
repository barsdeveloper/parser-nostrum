/** @template T */
export default class PairMap {

    /** @type {Map<Parser<any>, Map<Parser<any>, T>>} */
    #map = new Map()

    /**
     * @param {Parser<any>} first
     * @param {Parser<any>} second
     */
    get(first, second) {
        return this.#map.get(first)?.get(second)
    }

    /**
     * @param {Parser<any>} first
     * @param {Parser<any>} second
     * @param {T} value
     */
    set(first, second, value) {
        let map = this.#map.get(first)
        if (!map) {
            map = new Map()
            this.#map.set(first, map)
        }
        map.set(second, value)
        return this
    }

    /**
     * @param {Parser<any>} first
     * @param {Parser<any>} second
     * @param {T} value
     */
    setGet(first, second, value) {
        this.set(first, second, value)
        return value
    }
}
