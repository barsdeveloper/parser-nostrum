import Parser from "./Parser.js"

/** @template {Parser} T */
export default class Label extends Parser {

    #parser
    get parser() {
        return this.#parser
    }

    #label = ""

    /**
     * @param {T} parser
     * @param {String} label
     */
    constructor(parser, label) {
        super()
        this.#parser = parser
        this.#label = label
    }

    /**
     * @param {PathNode} path
     * @param {Number} index
     */
    makePath(path, index) {
        return path // Label does not alter the path
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     */
    parse(context, position, path, index) {
        this.parse = this.#parser.parse.bind(this.#parser)
        return this.parse(context, position, path, index)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {String} indentation
     * @param {PathNode} path
     * @param {Number} index
     */
    doToString(context, indentation, path, index) {
        let result = this.#parser.toString(context, "", path, index)
        result = Parser.frame(result, this.#label, indentation)
        return result
    }
}
