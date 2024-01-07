import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>} T
 * @extends {Parser<ParserValue<T>[]>}
 */
export default class TimesParser extends Parser {

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

    unwrap() {
        return [this.#parser]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        const result = /** @type {TimesParser<typeof parsers[0]>} */(new TimesParser(parsers[0], this.#min, this.#max))
        return result
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        const value = /** @type {ParserValue<T>[]} */([])
        const result = Reply.makeSuccess(position, value)
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position)
            if (!outcome.status) {
                return i >= this.#min ? result : Reply.makeFailure(position)
            }
            result.value.push(outcome.value)
            result.position = outcome.position
        }
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        let result = this.parser.toString(context, indent, highlight)
        const serialized =
            this.#min === 0 && this.#max === 1 ? "?"
                : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                    : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                        : "{"
                        + this.#min
                        + (this.#min !== this.#max ? "," + this.#max : "")
                        + "}"
        if (highlight === this) {
            result +=
                serialized
                + "\n"
                + " ".repeat(Parser.lastRowLength(result, Parser.indentation.length * indent))
                + "^".repeat(serialized.length)
                + " "
                + Parser.highlight
        } else {
            result = Parser.appendBeforeHighlight(result, serialized)
        }
        return result
    }
}
