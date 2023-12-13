import Parser from "./Parser.js"
import Reply from "../Reply.js"
import StringParser from "./StringParser.js"
import SuccessParser from "./SuccessParser.js"

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
export default class AlternativeParser extends Parser {

    #backtracking = false
    get backtracking() {
        return this.#backtracking
    }

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param {T} parsers */
    constructor(...parsers) {
        super()
        this.#parsers = parsers
        if (this.#parsers.length === 1) {
            this.isActualParser = false
        }
    }

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} T
     * @param {T} parsers
     * @returns {AlternativeParser<T>}
     */
    wrap(...parsers) {
        // @ts-expect-error
        const result = /** @type {AlternativeParser<T>} */(new this.Self(...parsers))
        result.#backtracking = this.#backtracking
        return result
    }

    asBacktracking() {
        const result = this.wrap(...this.#parsers)
        result.#backtracking = true
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        let result
        for (let i = 0; i < this.#parsers.length; ++i) {
            result = this.#parsers[i].parse(context, position)
            if (result.status) {
                return result
            }
        }
        return Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        if (
            !(other instanceof AlternativeParser)
            || this.#parsers.length != other.#parsers.length
            || this.#backtracking !== other.#backtracking
        ) {
            return false
        }
        for (let i = 0; i < this.#parsers.length; ++i) {
            if (!this.#parsers[i].equals(context, other.#parsers[i], strict)) {
                return false
            }
        }
        return true
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        if (this.#parsers.length === 2 && this.#parsers[1] instanceof SuccessParser) {
            let result = this.#parsers[0].toString(context, indent)
            if (!(this.#parsers[0] instanceof StringParser) && !context.visited.has(this.#parsers[0])) {
                result = "<" + result + ">"
            }
            result += "?"
            return result
        }
        return "ALT<\n"
            + deeperIndentation + this.#parsers
                .map(p => p.toString(context, indent + 1))
                .join("\n" + deeperIndentation + "| ")
            + "\n" + indentation + ">"
    }
}
