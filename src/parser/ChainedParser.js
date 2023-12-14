import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>} T
 * @template {(v: ParserValue<T>, input: String, position: Number) => Regexer<Parser<any>>} C
 * @extends Parser<ReturnType<C>>
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

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new ChainedParser(parsers[0], this.#fn)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result = this.#parser.parse(context, position)
        if (!result.status) {
            return result
        }
        result = this.#fn(result.value, context.input, result.position)?.getParser().parse(context, result.position)
            ?? Reply.makeFailure(result.position)
        return result
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.#parser.toString(context, indent) + " => chained<f()>"
    }
}
