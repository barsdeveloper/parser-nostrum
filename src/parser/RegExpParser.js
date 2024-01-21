import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template {Number} Group
 * @extends {Parser<Group extends -1 ? RegExpExecArray : String>}
 */
export default class RegExpParser extends Parser {

    /** @type {RegExp} */
    #regexp
    get regexp() {
        return this.#regexp
    }
    /** @type {RegExp} */
    #anchoredRegexp
    #group


    /**
     * @param {RegExp | RegExpParser} regexp
     * @param {Group} group
     */
    constructor(regexp, group) {
        super()
        if (regexp instanceof RegExp) {
            this.#regexp = regexp
            this.#anchoredRegexp = new RegExp(`^(?:${regexp.source})`, regexp.flags)
        } else if (regexp instanceof RegExpParser) {
            this.#regexp = regexp.#regexp
            this.#anchoredRegexp = regexp.#anchoredRegexp
        }
        this.#group = group
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     */
    // @ts-expect-error
    parse(context, position, path) {
        const match = this.#anchoredRegexp.exec(context.input.substring(position))
        if (match) {
            position += match[0].length
        }
        const result = match
            ? Reply.makeSuccess(position, this.#group >= 0 ? match[this.#group] : match, path, position)
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
        let result = "/" + this.#regexp.source + "/"
        if (this.isHighlighted(context, path)) {
            result += "\n" + Parser.indentation.repeat(indent) + "^".repeat(result.length) + " " + Parser.highlight
        }
        return result
    }
}
