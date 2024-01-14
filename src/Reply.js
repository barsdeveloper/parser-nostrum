export default class Reply {

    /**
     * @template T
     * @param {Number} position
     * @param {T} value
     * @param {Parser<any>[]} bestPath
     * @returns {Result<T>}
     */
    static makeSuccess(position, value, bestPath = [], bestPosition = 0) {
        return {
            status: true,
            value: value,
            position: position,
            bestParser: bestPath,
            bestPosition: bestPosition,
        }
    }

    /**
     * @param {Parser<any>[]} bestPath
     * @returns {Result<null>}
     */
    static makeFailure(position = 0, bestPath = [], bestPosition = 0) {
        return {
            status: false,
            value: null,
            position: position,
            bestParser: bestPath,
            bestPosition: bestPosition,
        }
    }

    /** @param {Parsernostrum<Parser<any>>} parsernostrum */
    static makeContext(parsernostrum = null, input = "") {
        return /** @type {Context} */({
            parsernostrum: parsernostrum,
            input: input,
            path: [],
            highlightedPath: [],
            highlightedParser: null,
        })
    }
}
