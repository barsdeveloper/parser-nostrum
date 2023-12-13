import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {String} T
 * @extends {Parser<T>}
 */
export default class StringParser extends Parser {

    static isTerminal = true
    static successParserInstance

    #value
    get value() {
        return this.#value
    }

    /** @param {T} value */
    constructor(value) {
        super()
        this.#value = value
    }

    /** @protected */
    doMatchesEmpty() {
        return this.#value === ""
    }

    /**
     * @protected
     * @param {Parser<any>[]} additionalTerminals
     * @param {Context} context
     */
    doTerminalList(type, additionalTerminals, context) {
        if (this.value === "") {
            return [StringParser.successParserInstance]
        }
        return [this]
    }

    /**
     * In an alternative, this would always match parser could might
     * @param {Parser<any>} parser
     */
    dominates(parser) {
        parser = parser.actualParser()
        if (parser instanceof StringParser) {
            const otherValue = /** @type {String} */(parser.#value)
            return otherValue.startsWith(this.#value)
        }
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const end = position + this.#value.length
        const value = context.input.substring(position, end)
        return this.#value === value
            ? Reply.makeSuccess(end, this.#value)
            : /** @type {Result<T>} */(Reply.makeFailure(position))
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof StringParser && this.#value === other.#value
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        const inlined = this.value.replaceAll("\n", "\\n")
        return this.value.length !== 1 || this.value.trim() !== this.value
            ? `"${inlined.replaceAll('"', '\\"')}"`
            : inlined
    }
}
