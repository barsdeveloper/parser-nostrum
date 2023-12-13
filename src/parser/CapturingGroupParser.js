import Parser from "./Parser.js"

/**
 * @template {Parser<any>} T
 * @extends Parser<ParserValue<T>>
 */
export default class CapturingGroupParser extends Parser {

    #parser

    #id
    get id() {
        return this.#id
    }

    /**
     * @param {T} parser
     * @param {String | Symbol} id
     */
    constructor(parser, id) {
        super()
        this.#parser = parser
        this.#id = id
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     */
    wrap(...parsers) {
        return new CapturingGroupParser(parsers[0], this.#id)
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
        return other instanceof CapturingGroupParser
            && this.#id == other.#id
            && this.#parser.equals(context, other.#parser, strict)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "(" + (this.#id !== "" ? `?<${this.#id}>` : "") + this.#parser.toString(context, indent) + ")"
    }
}
