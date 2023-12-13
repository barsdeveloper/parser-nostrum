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
    parse(context, position) {
        const match = this.#anchoredRegexp.exec(context.input.substring(position))
        return match
            ? Reply.makeSuccess(position + match[0].length, this.#group >= 0 ? match[this.#group] : match)
            : Reply.makeFailure(position)
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return other instanceof RegExpParser
            && (!strict || this.#group === other.#group)
            && this.#regexp.source === other.#regexp.source
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        return "/" + this.#regexp.source + "/"
    }
}
