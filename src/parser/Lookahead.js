import Parser from "./Parser.js"
import Reply from "../Reply.js"

/** @template {Parser} T */
export default class Lookahead extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #type
    get type() {
        return this.#type
    }

    /**
     * @readonly
     * @enum {String}
     */
    static Type = {
        NEGATIVE_AHEAD: "?!",
        NEGATIVE_BEHIND: "?<!",
        POSITIVE_AHEAD: "?=",
        POSITIVE_BEHIND: "?<=",
    }

    /**
     * @param {T} parser
     * @param {Type} type
     */
    constructor(parser, type) {
        super()
        this.#parser = parser
        this.#type = type
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    parse(context, position, path) {
        let result = this.#parser.parse(context, position, { parent: path, parser: this.#parser, index: 0 })
        result = result.status == (this.#type === Lookahead.Type.POSITIVE_AHEAD)
            ? Reply.makeSuccess(position, "", path, position)
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
        let result = "("
            + this.#type
            + this.#parser.toString(context, indent, { parent: path, parser: this.#parser, index: 0 })
            + ")"
        if (this.isHighlighted(context, path)) {
            result = result.replace(
                /(\n)|$/,
                "\n"
                + Parser.indentation.repeat(indent)
                + "^".repeat(this.#type.length + 1)
                + " "
                + Parser.highlight
                + "$1"
            )
        }
        return result
    }
}
