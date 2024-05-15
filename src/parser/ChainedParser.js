import Parser from "./Parser.js"

/**
 * @template {Parser} T
 * @template {(v: ParserValue<T>, input: String, position: Number) => Parsernostrum<Parser>} C
 */
export default class ChainedParser extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #fn

    /**
     * @param {T} parser
     * @param {C} chained
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
     * @returns {Result<ParserValue<UnwrapParser<ReturnType<C>>>>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        const outcome = this.#parser.parse(context, position, path, 0)
        if (!outcome.status) {
            // @ts-expect-error
            return outcome
        }
        // @ts-expect-error
        const result = this.#fn(outcome.value, context.input, outcome.position)
            .getParser()
            .parse(context, outcome.position)
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
