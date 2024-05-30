import Reply from "../Reply.js"
import Parser from "./Parser.js"

/**
 * @template T
 * @extends Parser<T>
 */
export default class RegExpParser extends Parser {

    /** @type {RegExp} */
    #regexp
    get regexp() {
        return this.#regexp
    }
    /** @type {RegExp} */
    #anchoredRegexp
    #matchMapper

    static #createEscapeable = character => String.raw`[^${character}\\]*(?:\\.[^${character}\\]*)*`
    static #numberRegex = /[-\+]?(?:\d*\.)?\d+/
    static common = {
        number: new RegExp(this.#numberRegex.source + String.raw`(?!\.)`),
        numberInteger: /[\-\+]?\d+(?!\.\d)/,
        numberNatural: /\d+/,
        numberExponential: new RegExp(this.#numberRegex.source + String.raw`(?:[eE][\+\-]?\d+)?(?!\.)`),
        numberUnit: /\+?(?:0(?:\.\d+)?|1(?:\.0+)?)(?![\.\d])/,
        numberByte: /0*(?:25[0-5]|2[0-4]\d|1?\d?\d)(?!\d|\.)/,
        whitespace: /\s+/,
        whitespaceOpt: /\s*/,
        whitespaceInline: /[^\S\n]+/,
        whitespaceInlineOpt: /[^\S\n]*/,
        whitespaceMultiline: /\s*?\n\s*/,
        doubleQuotedString: new RegExp(`"(${this.#createEscapeable('"')})"`),
        singleQuotedString: new RegExp(`'(${this.#createEscapeable("'")})'`),
        backtickQuotedString: new RegExp("`(" + this.#createEscapeable("`") + ")`"),
    }

    /**
     * @param {RegExp} regexp
     * @param {(match: RegExpExecArray) => T} matchMapper
     */
    constructor(regexp, matchMapper) {
        super()
        this.#regexp = regexp
        this.#anchoredRegexp = new RegExp(`^(?:${regexp.source})`, regexp.flags)
        this.#matchMapper = matchMapper
    }

    /**
     * @param {Context} context
     * @param {Number} position
     * @param {PathNode} path
     * @param {Number} index
     * @returns {Result<T>}
     */
    parse(context, position, path, index) {
        path = this.makePath(path, index)
        const match = this.#anchoredRegexp.exec(context.input.substring(position))
        if (match) {
            position += match[0].length
        }
        const result = match
            ? Reply.makeSuccess(position, this.#matchMapper(match), path, position)
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
        let result = "/" + this.#regexp.source + "/"
        const shortname = Object.entries(RegExpParser.common).find(([k, v]) => v.source === this.#regexp.source)?.[0]
        if (shortname) {
            result = "P." + shortname
        }
        return result
    }
}
