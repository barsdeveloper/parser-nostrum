export default class Reply {

    /**
     * @template T
     * @param {Number} position
     * @param {T} value
     * @returns {Result<T>}
     */
    static makeSuccess(position, value, bestParser = null, bestPosition = 0) {
        return {
            status: true,
            value: value,
            position: position,
            bestParser: bestParser,
            bestPosition: bestPosition,
        }
    }

    /**
     * @param {Parser<any>} bestParser
     * @returns {Result<null>}
     */
    static makeFailure(position = 0, bestParser = null, bestPosition = 0) {
        return {
            status: false,
            value: null,
            position: position,
            bestParser: bestParser,
            bestPosition: bestPosition,
        }
    }

    /** @param {Parsernostrum<Parser<any>>} parsernostrum */
    static makeContext(parsernostrum = null, input = "") {
        return /** @type {Context} */({
            parsernostrum: parsernostrum,
            input: input,
            visited: new Map(),
        })
    }
}
