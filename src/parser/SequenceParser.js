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

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const value = /** @type {ParserValue<T>} */(new Array(this.#parsers.length))
        const result = Reply.makeSuccess(position, value)
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(
                context,
                result.position,
                { parent: path, parser: this.#parsers[i], index: i }
            )
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
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const indentation = Parser.indentation.repeat(indent)
        const deeperIndentation = Parser.indentation.repeat(indent + 1)
        const result = "SEQ<\n"
            + (this.isHighlighted(context, path) ? `${indentation}^^^ ${Parser.highlight}\n` : "")
            + this.#parsers
                .map((parser, index) => deeperIndentation + parser.toString(context, indent + 1, { parent: path, parser, index }))
                .join("\n")
            + "\n" + indentation + ">"
        return result
    }
}
