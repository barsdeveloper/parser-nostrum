import Reply from "../Reply.js"
import Parser from "./Parser.js"

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
     * @param {Number} index
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        let result = this.#parser.parse(context, position, path, 0)
        result = result.status == (this.#type === Lookahead.Type.POSITIVE_AHEAD)
            ? Reply.makeSuccess(position, "", path, position)
            : Reply.makeFailure()
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
        return "(" + this.#type + this.#parser.toString(context, indentation, path, 0) + ")"
    }
}
