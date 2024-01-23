import Parser from "./Parser.js"
import Reply from "../Reply.js"

/**
 * @template T
 * @extends {Parser<T>}
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
    static commonParser = {
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
     */
    parse(context, position, path) {
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
     * @param {Number} indent
     * @param {PathNode} path
     */
    doToString(context, indent, path) {
        let result = "/" + this.#regexp.source + "/"
        const shortname = Object
            .entries(RegExpParser.commonParser)
            .find(([k, v]) => v.source === this.#regexp.source)?.[0]
        if (shortname) {
            result = "P." + shortname
        }
        if (this.isHighlighted(context, path)) {
            result += "\n" + Parser.indentation.repeat(indent) + "^".repeat(result.length) + " " + Parser.highlight
        }
        return result
    }
}
