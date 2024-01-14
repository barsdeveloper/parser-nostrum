import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Parser<any>[]} T
 * @extends Parser<ParserValue<T>>
 */
export default class SequenceParser extends Parser {

    #parsers
    get parsers() {
        return this.#parsers
    }

    /** @param  {T} parsers */
    constructor(...parsers) {
        super()
        this.#parsers = parsers
    }

    unwrap() {
        return [...this.#parsers]
    }

    /**
     * @template {Parser<any>[]} P
     * @param {P} parsers
     */
    wrap(...parsers) {
        return new SequenceParser(...parsers)
    }

    /**
     * @param {Context} context
     * @param {Number} position
     */
    parse(context, position) {
        context.path.push(this)
        const value = /** @type {ParserValue<T>} */(new Array(this.#parsers.length))
        const result = Reply.makeSuccess(position, value)
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position)
            if (outcome.bestPosition > result.bestPosition) {
                result.bestParser = outcome.bestParser
                result.bestPosition = outcome.bestPosition
            }
            if (!outcome.status) {
                result.status = false
                result.value = null
                break
            }
            result.value[i] = outcome.value
            result.position = outcome.position
        }
        context.path.pop()
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     */
    doToString(context, indent) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        const result = "SEQ<\n"
            + (this.isHighlighted(context) ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + this.#parsers.map(p => deeperIndentation + p.toString(context, indent + 1)).join("\n")
            + "\n" + indentation + ">"
        return result
    }
}
