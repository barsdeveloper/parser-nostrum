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
        const value = /** @type {ParserValue<T>} */(new Array(this.#parsers.length))
        const result = Reply.makeSuccess(position, value, this)
        const furthest = Reply.makeFailure()
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position)
            if (outcome.position > furthest.position) {
                furthest.position = outcome.position
                furthest.value = outcome.value
                furthest.parser = outcome.parser
            }
            if (!outcome.status) {
                return furthest
            }
            result.value[i] = outcome.value
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
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        return "SEQ<\n"
            + (highlight === this ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + this.#parsers.map(p => deeperIndentation + p.toString(context, indent + 1, highlight)).join("\n")
            + "\n" + indentation + ">"
    }
}
