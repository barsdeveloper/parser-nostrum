import Reply from "../Reply.js"
import Parser from "./Parser.js"

/** @template {Parser} T */
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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        const value = /** @type {ParserValue<T>[]} */([])
        const result = Reply.makeSuccess(position, value, path)
        for (let i = 0; i < this.#max; ++i) {
            const outcome = this.#parser.parse(context, result.position, path, 0)
            if (outcome.bestPosition > result.bestPosition) {
                result.bestParser = outcome.bestParser
                result.bestPosition = outcome.bestPosition
            }
            if (!outcome.status) {
                if (i < this.#min) {
                    result.status = false
                    result.value = null
                }
                break
            }
            result.value.push(outcome.value)
            result.position = outcome.position
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
        let result = this.parser.toString(context, indentation, path, 0)
        const serialized =
            this.#min === 0 && this.#max === 1 ? "?"
                : this.#min === 0 && this.#max === Number.POSITIVE_INFINITY ? "*"
                    : this.#min === 1 && this.#max === Number.POSITIVE_INFINITY ? "+"
                        : "{"
                        + this.#min
                        + (this.#min !== this.#max ? "," + this.#max : "")
                        + "}"
        result += serialized
        return result
    }
}
