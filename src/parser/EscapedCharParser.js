import Parser from "./Parser.js"
import StringParser from "./StringParser.js"

/**
 * @template {String} T
 * @extends {StringParser<T>}
 */
export default class EscapedCharParser extends StringParser {

    #type

    /**
     * @readonly
     * @enum {number}
     */
    static Type = {
        NORMAL: 0,
        HEX: 1,
        UNICODE: 2,
        UNICODE_FULL: 3,
    }

    // Special regex characters and their matched value
    static specialEscapedCharacters = {
        "0": "\0",
        "b": "\b",
        "r": "\r",
        "v": "\v",
        "t": "\t",
        "n": "\n",
    }

    /** @param {T} value */
    constructor(value, type = EscapedCharParser.Type.NORMAL) {
        if (
            type === EscapedCharParser.Type.NORMAL && value.length > 1
            || Intl.Segmenter && [...new Intl.Segmenter().segment(value)].length > 1
        ) {
            throw new Error("Expected a single character")
        }
        super(value)
        this.#type = type
    }

    /**
     * @protected
     * @param {Context} context
     * @param {Parser<any>} other
     * @param {Boolean} strict
     */
    doEquals(context, other, strict) {
        return (!strict || other instanceof EscapedCharParser && this.#type === other.#type)
            && super.doEquals(context, other, strict)
    }

    /**
     * @protected
     * @param {Context} context
     */
    doToString(context, indent = 0) {
        switch (this.#type) {
            case EscapedCharParser.Type.NORMAL:
                return "\\" + (
                    Object.entries(EscapedCharParser.specialEscapedCharacters)
                        .find(([k, v]) => this.value === v)
                    ?.[0]
                    ?? super.doToString(context, indent)
                )
            case EscapedCharParser.Type.HEX:
                return "\\x" + this.value.codePointAt(0).toString(16)
            case EscapedCharParser.Type.UNICODE:
                return "\\u" + this.value.codePointAt(0).toString(16).padStart(4, "0")
            case EscapedCharParser.Type.UNICODE_FULL:
                return "\\u{" + this.value.codePointAt(0).toString(16) + "}"
        }
        return super.doToString(context, indent)
    }
}
