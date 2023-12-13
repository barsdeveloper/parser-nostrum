import AlternativeParser from "./AlternativeParser.js"
import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>[]} T
 * @extends AlternativeParser<T>
 */
export default class ClassParser extends AlternativeParser {

    #negative
    get negative() {
        return this.#negative
    }

    /**
     * @param {T} parsers
     * @param {Boolean} negative
     */
    constructor(negative, ...parsers) {
        super(...parsers)
        this.#negative = negative
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new ClassParser(this.#negative, ...parsers)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result = super.parse(context, position)
        if (this.#negative) {
            result = !result.status && position < context.input.length
                ? Reply.makeSuccess(position + 1, context.input[position])
                : Reply.makeFailure(position)
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return (
            !strict && !this.#negative && !(other instanceof ClassParser && other.#negative)
            || other instanceof ClassParser && this.negative === other.#negative
        )
            && super.doEquals(context, other, strict)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "["
            + this.parsers.map(p => p.toString(context, indent)).join("")
            + "]"
    }
}
