import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @template {String} T */
export default class StringParser extends Parser {

    #value
    get value() {
        return this.#value
    }

    /** @param {T} value */
    constructor(value) {
        super()
        this.#value = value
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        const end = position + this.#value.length
        const value = context.input.substring(position, end)
        const result = this.#value === value
            ? Reply.makeSuccess(end, this.#value, path, end)
            : Reply.makeFailure()
        return result
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        const inlined = this.value.replaceAll("\n", "\\n")
        let result = !this.value.match(/^[a-zA-Z]$/)
            ? `"${inlined.replaceAll('"', '\\"')}"`
            : inlined
        if (this.isHighlighted(context, path)) {
            result += "\n" + Parser.indentation.repeat(indent) + "^".repeat(result.length) + " " + Parser.highlight
        }
        return result
    }
}
