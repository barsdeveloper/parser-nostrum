import Reply from "../Reply.js"
import Parser from "./Parser.js"

/** @template {Parser[]} T */
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
     * @param {Number} index
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        const value = /** @type {ParserValue<T>} */(new Array(this.#parsers.length))
        const result = Reply.makeSuccess(position, value)
        for (let i = 0; i < this.#parsers.length; ++i) {
            const outcome = this.#parsers[i].parse(context, result.position, path, i)
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
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        const deeperIndentation = indentation + Parser.indentation
        const result = "SEQ<\n"
            + deeperIndentation
            + this.#parsers
                .map((parser, index) => parser.toString(context, deeperIndentation, path, index))
                .join("\n" + deeperIndentation)
            + "\n" + indentation + ">"
        return result
    }
}
