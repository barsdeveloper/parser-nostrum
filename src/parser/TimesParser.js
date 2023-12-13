import Parser from "./Parser.js"
import Reply from "../Reply.js"
import SuccessParser from "./SuccessParser.js"

/**
 * @template {Parser<any>} T
 * @extends {Parser<ParserValue<T>[]>}
 */
export default class TimesParser extends Parser {

    #backtracking = false
    get backtracking() {
        return this.#backtracking
    }

    #parser
    get parser() {
        return this.#parser
    }

    #min
    get min() {
        return this.#min
    }

    #max
    get max() {
        return this.#max
    }

    /** @param {T} parser */
    constructor(parser, min = 0, max = Number.POSITIVE_INFINITY) {
        super()
        if (min > max) {
            throw new Error("Min is greater than max")
        }
        this.#parser = parser
        this.#min = min
        this.#max = max
    }

    /** @protected */
    doMatchesEmpty() {
        return this.#min === 0
    }

    /**
     * @protected
     * @param {Parser<any>[]} additionalTerminals
     * @param {Context} context
     */
    doTerminalList(type, additionalTerminals, context) {
        const result = this.#parser.terminalList(type, additionalTerminals, context)
        if (this.matchesEmpty() && !result.some(p => SuccessParser.instance.equals(context, p, false))) {
            result.push(SuccessParser.instance)
        }
        return result
    }

    unwrap(target = /** @type {Parser<any>} */(null)) {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const result = /** @type {TimesParser<typeof parsers[0]>} */(new TimesParser(parsers[0], this.#min, this.#max))
        if (this.#backtracking) {
            result.#backtracking = true
        }
        return result
    }

    asBacktracking() {
        const result = new TimesParser(this.#parser, this.#min, this.#max)
        result.#backtracking = true
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = []
        const result = /** @type {Result<ParserValue<T>[]>} */(
            Reply.makeSuccess(position, value)
        )
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position)
            if (!outcome.status) {
                return i >= this.#min ? result : outcome
            }
            result.value.push(outcome.value)
            result.position = outcome.position
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
        return other instanceof TimesParser
            && this.#backtracking === other.#backtracking
            && this.#min === other.#min
            && this.#max === other.#max
            && this.#parser.equals(context, other.#parser, strict)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return this.parser.toString(context, indent)
            + (
                this.#min === 0 && this.#max === 1 ? "?"
                    : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                        : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                            : "{"
                            + this.#min
                            + (this.#min !== this.#max ? "," : this.#max !== Number.POSITIVE_INFINITY ? this.#max : "")
                            + "}"
            )
    }
}
