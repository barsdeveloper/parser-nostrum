import Parser from "./Parser.js"

/**
 * @readonly
 * @enum {number}
 */
export const GroupType = {
    ATOMIC: -1,
    NON_CAPTURING: 0,
    CAPTURING: 1,
}

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class NonCapturingGroupParser extends Parser {

    #parser

    isActualParser = false

    /** @param {T} parser */
    constructor(parser) {
        super()
        this.#parser = parser
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new NonCapturingGroupParser(parsers[0])
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        return this.#parser.parse(context, position)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof NonCapturingGroupParser && this.#parser.equals(context, other.#parser, strict)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        let group = ""
        return "(?:" + this.#parser.toString(context, indent) + ")"
    }
}
