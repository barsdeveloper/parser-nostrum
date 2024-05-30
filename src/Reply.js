export default class Reply {

    /**
     * @template T
     * @param {Number} position
     * @param {T} value
     * @param {PathNode} bestPath
     * @returns {Result<T>}
     */
    static makeSuccess(position, value, bestPath = null, bestPosition = 0) {
        return {
            status: true,
            value: value,
            position: position,
            bestParser: bestPath,
            bestPosition: bestPosition,
        }
    }

    /**
     * @param {PathNode} bestPath
     * @returns {Result<null>}
     */
    static makeFailure(position = 0, bestPath = null, bestPosition = 0) {
        return {
            status: false,
            value: null,
            position,
            bestParser: bestPath,
            bestPosition: bestPosition,
        }
    }

    /** @param {Parsernostrum<any>} parsernostrum */
    static makeContext(parsernostrum = null, input = "") {
        return /** @type {Context} */({
            parsernostrum,
            input,
            highlighted: null,
        })
    }

    static makePathNode(parser, index = 0, previous = null) {
        return /** @type {PathNode} */({
            parent: previous,
            current: parser,
            index,
        })
    }
}
