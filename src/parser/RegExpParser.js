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
     */
    // @ts-expect-error
    parse(context, position) {
        const match = this.#anchoredRegexp.exec(context.input.substring(position))
        if (match) {
            position += match[0].length
        }
        return match
            ? Reply.makeSuccess(position, this.#group >= 0 ? match[this.#group] : match, this, position)
            : Reply.makeFailure()
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} highlight
     */
    doToString(context, indent, highlight) {
        let result = "/" + this.#regexp.source + "/"
        if (highlight === this) {
            result += "\n" + Parser.indentation.repeat(indent) + "^".repeat(result.length) + " " + Parser.highlight
        }
        return result
    }
}
