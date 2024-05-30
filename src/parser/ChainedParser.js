import Parser from "./Parser.js"

/**
 * @template S
 * @template T
 * @extends Parser<T>
 */
export default class ChainedParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #fn

    /**
     * @param {Parser<S>} parser
     * @param {(v: S, input: String, position: Number) => Parsernostrum<T>} chained
     */
    constructor(parser, chained) {
        super()
        this.#parser = parser
        this.#fn = chained
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        const outcome = this.#parser.parse(context, position, path, 0)
        if (!outcome.status) {
            // @ts-expect-error
            return outcome
        }
        const result = this.#fn(outcome.value, context.input, outcome.position)
            .getParser()
            .parse(context, outcome.position, path, 0)
        if (outcome.bestPosition > result.bestPosition) {
            result.bestParser = outcome.bestParser
            result.bestPosition = outcome.bestPosition
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        const result = this.#parser.toString(context, indentation, path, 0) + " => chained<f()>"
        return result
    }
}
